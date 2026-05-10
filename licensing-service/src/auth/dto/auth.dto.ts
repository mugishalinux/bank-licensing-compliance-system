import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsJWT,
  IsOptional,
  IsString,
  Length,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApplicantType } from '../../common/enums/applicant-type.enum';

const lower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.toLowerCase().trim() : value;

export class RegisterDto {
  @IsEmail()
  @Transform(lower)
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @Length(2, 255)
  full_name: string;

  @IsOptional()
  @IsString()
  @Length(5, 30)
  phone?: string;

  @IsEnum(ApplicantType)
  applicant_type: ApplicantType;

  @ValidateIf((o: RegisterDto) => o.applicant_type === ApplicantType.ORGANIZATION)
  @IsString()
  @Length(2, 500)
  institution_name?: string;
}

export class RequestLoginOtpDto {
  @IsEmail()
  @Transform(lower)
  email: string;

  @IsString()
  password: string;
}

export class ConfirmLoginOtpDto {
  @IsEmail()
  @Transform(lower)
  email: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}

export class RequestPasswordResetDto {
  @IsEmail()
  @Transform(lower)
  email: string;
}

export class ConfirmPasswordResetDto {
  @IsEmail()
  @Transform(lower)
  email: string;

  @IsString()
  @Length(6, 6)
  otp: string;

  @IsString()
  @MinLength(8)
  new_password: string;
}

export class RefreshDto {
  @IsJWT()
  refresh_token: string;
}
