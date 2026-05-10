import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartReviewDto {
  // No body required — reviewer identity comes from JWT
}

export class RequestAdditionalInfoDto {
  @ApiPropertyOptional({ description: 'Instructions for what additional info is needed' })
  @IsString()
  additional_info_request: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewer_notes?: string;
}

export class CompleteReviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewer_notes?: string;
}

export class MakeDecisionDto {
  @ApiPropertyOptional({ description: 'Notes explaining the approval or rejection decision' })
  @IsOptional()
  @IsString()
  decision_notes?: string;

  @ApiPropertyOptional({ description: 'Expected version for optimistic locking' })
  @IsOptional()
  @IsInt()
  expected_version?: number;
}
