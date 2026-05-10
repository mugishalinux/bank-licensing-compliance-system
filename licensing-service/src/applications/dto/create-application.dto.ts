import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ example: 'Kigali Commercial Bank Ltd' })
  @IsString()
  @MaxLength(500)
  institution_name: string;

  @ApiProperty({ example: 'Commercial Bank' })
  @IsString()
  @MaxLength(100)
  institution_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'KG 7 Ave, Kigali' })
  @IsOptional()
  @IsString()
  registered_address?: string;

  @ApiPropertyOptional({ example: 'RCA/000123' })
  @IsOptional()
  @IsString()
  registration_number?: string;
}
