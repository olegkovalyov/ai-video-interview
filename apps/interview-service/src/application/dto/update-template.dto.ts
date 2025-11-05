import { IsString, MaxLength, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewSettingsDto } from './create-template.dto';

export class UpdateTemplateDto {
  @ApiPropertyOptional({ 
    description: 'Updated interview template title',
    maxLength: 200,
    example: 'Senior Full-Stack Developer Interview'
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ 
    description: 'Updated detailed description',
    maxLength: 1000,
    example: 'Updated comprehensive interview for senior full-stack developers'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Updated interview settings',
    type: InterviewSettingsDto
  })
  @IsOptional()
  @IsObject()
  settings?: InterviewSettingsDto;
}
