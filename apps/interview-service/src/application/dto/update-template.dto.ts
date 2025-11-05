import { IsString, MaxLength, IsOptional, IsObject } from 'class-validator';
import { InterviewSettingsDto } from './create-template.dto';

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsObject()
  settings?: InterviewSettingsDto;
}
