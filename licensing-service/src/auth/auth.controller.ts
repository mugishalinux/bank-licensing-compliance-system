import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import {
  ConfirmLoginOtpDto,
  ConfirmPasswordResetDto,
  RefreshDto,
  RegisterDto,
  RequestLoginOtpDto,
  RequestPasswordResetDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import type { JwtPayload } from './strategies/jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: seconds(60) } })
  @ResponseMessage('Account created')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('request-login-otp')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @ResponseMessage('OTP sent')
  requestLoginOtp(@Body() dto: RequestLoginOtpDto) {
    return this.auth.requestLoginOtp(dto);
  }

  @Post('confirm-login-otp')
  @HttpCode(200)
  @ResponseMessage('Signed in')
  confirmLoginOtp(@Body() dto: ConfirmLoginOtpDto) {
    return this.auth.confirmLoginOtp(dto);
  }

  @Post('request-password-reset')
  @HttpCode(200)
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.auth.requestPasswordReset(dto);
  }

  @Post('confirm-password-reset')
  @HttpCode(200)
  @ResponseMessage('Password updated')
  confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.auth.confirmPasswordReset(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Signed out')
  async logout(@Req() req: Request) {
    const payload = (req as Request & { user?: User }).user;
    const raw = (req as Request & { user?: User; authInfo?: unknown }).authInfo;
    void payload;
    void raw;
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Missing token');
    const token = header.slice(7);
    const decoded = this.decodeWithoutVerify(token);
    if (!decoded) throw new UnauthorizedException('Invalid token');
    await this.auth.logout(decoded, decoded.exp);
    return { message: 'Signed out' };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department_id: user.department_id,
      department: user.department,
      applicant_type: user.applicant_type,
      institution_name: user.institution_name,
      phone: user.phone,
    };
  }

  private decodeWithoutVerify(token: string): (JwtPayload & { exp: number }) | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as JwtPayload & {
        exp: number;
      };
    } catch {
      return null;
    }
  }
}
