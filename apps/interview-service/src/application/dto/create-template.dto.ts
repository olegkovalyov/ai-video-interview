import { IsString, IsNotEmpty, MaxLength, IsOptional, IsObject, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InterviewSettingsDto {
  @ApiProperty({ 
    description: 'Total time limit for the interview in minutes', 
    minimum: 1, 
    maximum: 480,
    example: 60
  })
  @IsNumber()
  @Min(1)
  @Max(480)
  totalTimeLimit: number;

  @ApiProperty({ 
    description: 'Allow candidates to retake the interview',
    example: false
  })
  @IsBoolean()
  allowRetakes: boolean;

  @ApiProperty({ 
    description: 'Show timer to candidates during interview',
    example: true
  })
  @IsBoolean()
  showTimer: boolean;

  @ApiProperty({ 
    description: 'Randomize question order for each candidate',
    example: false
  })
  @IsBoolean()
  randomizeQuestions: boolean;
}

export class CreateTemplateDto {
  @ApiProperty({ 
    description: 'Interview template title', 
    minLength: 1,
    maxLength: 200,
    example: 'Senior Developer Interview'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ 
    description: 'Detailed description of the interview template', 
    minLength: 1,
    maxLength: 1000,
    example: 'Comprehensive interview for senior backend developers with focus on system design and architecture'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({ 
    description: 'Interview settings (optional)',
    type: InterviewSettingsDto
  })
  @IsOptional()
  @IsObject()
  settings?: InterviewSettingsDto;
}
