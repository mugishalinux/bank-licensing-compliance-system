import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export class PresignUploadDto {
  @IsString()
  @Length(1, 500)
  original_name: string;

  @IsString()
  mime_type: string;

  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024)
  size: number;

  @IsOptional()
  @IsUUID()
  requirement_id?: string;
}

export const ALLOWED_MIME_TYPES = ALLOWED_MIME;
