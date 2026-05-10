import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApplicantType } from '../../common/enums/applicant-type.enum';

const STAFF_ROLES: UserRole[] = [UserRole.REVIEWER, UserRole.APPROVER];

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty()
  @IsString()
  @Length(2, 255)
  full_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(5, 30)
  phone?: string;

  @ApiPropertyOptional({ description: 'Required when role is REVIEWER or APPROVER' })
  @ValidateIf((o: CreateUserDto) => STAFF_ROLES.includes(o.role))
  @IsUUID()
  department_id?: string;

  @ApiPropertyOptional({ description: 'Required when role is APPLICANT', enum: ApplicantType })
  @ValidateIf((o: CreateUserDto) => o.role === UserRole.APPLICANT)
  @IsEnum(ApplicantType)
  applicant_type?: ApplicantType;

  @ApiPropertyOptional({ description: 'Required when applicant_type is ORGANIZATION' })
  @ValidateIf((o: CreateUserDto) => o.applicant_type === ApplicantType.ORGANIZATION)
  @IsString()
  @Length(2, 500)
  institution_name?: string;
}
