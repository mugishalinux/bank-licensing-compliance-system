import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateLicenseRequirementDto {
  @IsString()
  @Length(2, 200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_mandatory?: boolean;

  @IsOptional()
  @IsBoolean()
  requires_attachment?: boolean;
}

export class UpdateLicenseRequirementDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_mandatory?: boolean;

  @IsOptional()
  @IsBoolean()
  requires_attachment?: boolean;
}
