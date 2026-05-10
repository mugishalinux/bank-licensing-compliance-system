import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { ApplicantType } from '../../common/enums/applicant-type.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  full_name?: string;

  @IsOptional()
  @IsString()
  @Length(5, 30)
  phone?: string;

  @IsOptional()
  @IsUUID()
  department_id?: string | null;

  @IsOptional()
  @IsEnum(ApplicantType)
  applicant_type?: ApplicantType | null;

  @IsOptional()
  @IsString()
  @Length(2, 500)
  institution_name?: string | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
