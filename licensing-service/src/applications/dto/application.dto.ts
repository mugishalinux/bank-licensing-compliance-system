import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '../../common/enums/application-status.enum';

export class CreateApplicationDto {
  @IsUUID()
  license_type_id: string;
}

export class DecisionDto {
  @IsString()
  @Length(1, 5000)
  comment: string;

  @IsOptional()
  @IsString()
  attachment_key?: string;

  @IsOptional()
  @IsString()
  attachment_name?: string;
}

export class RequestInfoDto extends DecisionDto {}
export class ApproveDto extends DecisionDto {}
export class RejectDto extends DecisionDto {}
export class CompleteReviewDto extends DecisionDto {}

export class ListApplicationsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  license_type_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  mine?: boolean;
}
