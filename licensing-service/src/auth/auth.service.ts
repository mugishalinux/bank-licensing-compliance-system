import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { User } from '../users/entities/user.entity';
import { ApplicantType } from '../common/enums/applicant-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import {
  ConfirmLoginOtpDto,
  ConfirmPasswordResetDto,
  RegisterDto,
  RequestLoginOtpDto,
  RequestPasswordResetDto,
} from './dto/auth.dto';
import { RedisHelper } from '../common/helpers/redis.helper';
import { EventsHelper } from '../common/helpers/events.helper';
import otpGenerator from 'otp-generator';

const OTP_TTL = 5 * 60;
const PWRESET_TTL = 10 * 60;
const BCRYPT_ROUNDS = 12;

interface OtpRecord {
  otp: string;
  user_id: string;
}

interface AccessPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti: string;
}

interface RefreshPayload {
  sub: string;
  type: 'refresh';
  jti: string;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private jwt: JwtService,
    private cfg: ConfigService,
    private redis: RedisHelper,
    private events: EventsHelper,
  ) {}

  async register(dto: RegisterDto) {
    if (await User.findOne({ where: { email: dto.email } })) {
      throw new ConflictException('Email already in use');
    }

    const u = new User();
    u.email = dto.email;
    u.password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    u.role = UserRole.APPLICANT;
    u.full_name = dto.full_name;
    u.phone = dto.phone ?? null;
    u.applicant_type = dto.applicant_type;
    u.institution_name =
      dto.applicant_type === ApplicantType.ORGANIZATION ? (dto.institution_name ?? null) : null;
    await u.save();

    await this.events.sendEmail({
      to: u.email,
      name: u.full_name,
      subject: 'Welcome to BNR Licensing Portal',
      message: 'Your account has been created. You can now sign in.',
    });

    return { id: u.id };
  }

  async requestLoginOtp(dto: RequestLoginOtpDto) {
    const user = await User.findOne({ where: { email: dto.email, is_active: true } });
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const otp = this.generateOtp();
    await this.redis.set(this.loginKey(user.email), { otp, user_id: user.id }, OTP_TTL);

    await this.events.sendEmail({
      to: user.email,
      name: user.full_name,
      subject: 'Your sign-in code',
      message: `Your sign-in code is ${otp}. It expires in 5 minutes.`,
    });

    return { message: 'OTP sent to your email' };
  }

  async confirmLoginOtp(dto: ConfirmLoginOtpDto) {
    const rec = await this.redis.get<OtpRecord>(this.loginKey(dto.email));
    if (!rec || rec.otp !== dto.otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await User.findOne({ where: { id: rec.user_id, is_active: true } });
    if (!user) throw new UnauthorizedException('Account is inactive');

    await this.redis.del(this.loginKey(dto.email));
    return this.issueTokens(user);
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await User.findOne({ where: { email: dto.email, is_active: true } });
    if (user) {
      const otp = this.generateOtp();
      await this.redis.set(
        this.resetKey(user.email),
        { otp, user_id: user.id },
        PWRESET_TTL,
      );
      await this.events.sendEmail({
        to: user.email,
        name: user.full_name,
        subject: 'Reset your password',
        message: `Your password reset code is ${otp}. It expires in 10 minutes.`,
      });
    }
    return { message: 'If an account exists, an OTP has been sent' };
  }

  async confirmPasswordReset(dto: ConfirmPasswordResetDto) {
    const rec = await this.redis.get<OtpRecord>(this.resetKey(dto.email));
    if (!rec || rec.otp !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    const user = await User.findOne({ where: { id: rec.user_id, is_active: true } });
    if (!user) throw new BadRequestException('Account not found');

    user.password_hash = await bcrypt.hash(dto.new_password, BCRYPT_ROUNDS);
    await user.save();
    await this.redis.del(this.resetKey(dto.email));

    return { message: 'Password updated' };
  }

  async refresh(token: string) {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: this.cfg.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Wrong token type');
    if (await this.redis.exists(this.blacklistKey(payload.jti))) {
      throw new UnauthorizedException('Token revoked');
    }
    const user = await User.findOne({ where: { id: payload.sub, is_active: true } });
    if (!user) throw new UnauthorizedException('Account is inactive');
    return this.issueTokens(user);
  }

  async logout(payload: AccessPayload, exp: number) {
    const ttl = Math.max(1, exp - Math.floor(Date.now() / 1000));
    await this.redis.set(this.blacklistKey(payload.jti), true, ttl);
  }

  isBlacklisted(jti: string) {
    return this.redis.exists(this.blacklistKey(jti));
  }

  private async issueTokens(user: User) {
    const accessJti = uuid();
    const refreshJti = uuid();
    const accessPayload: AccessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: accessJti,
    };
    const refreshPayload: RefreshPayload = {
      sub: user.id,
      type: 'refresh',
      jti: refreshJti,
    };

    const access_token = await this.jwt.signAsync(accessPayload);
    const refresh_token = await this.jwt.signAsync(refreshPayload, {
      secret: this.cfg.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.cfg.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department_id: user.department_id,
        applicant_type: user.applicant_type,
        institution_name: user.institution_name,
      },
    };
  }

  private generateOtp(): string {
    return otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
  }

  private loginKey(email: string) {
    return `otp:login:${email}`;
  }

  private resetKey(email: string) {
    return `otp:pwreset:${email}`;
  }

  private blacklistKey(jti: string) {
    return `jwt-blacklist:${jti}`;
  }
}
