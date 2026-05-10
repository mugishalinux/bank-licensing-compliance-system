import { IsOptional, IsString, Length } from 'class-validator';

export class AddCommentDto {
  @IsString()
  @Length(1, 5000)
  body: string;

  @IsOptional()
  @IsString()
  attachment_key?: string;

  @IsOptional()
  @IsString()
  attachment_name?: string;
}
