import { IsString, IsNotEmpty, MaxLength, IsOptional, IsObject, IsNumber, Min, Max, IsBoolean } from 'class-validator';

export class InterviewSettingsDto {
  @IsNumber()
  @Min(1)
  @Max(480)
  totalTimeLimit: number;

  @IsBoolean()
  allowRetakes: boolean;

  @IsBoolean()
  showTimer: boolean;

  @IsBoolean()
  randomizeQuestions: boolean;
}

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @IsOptional()
  @IsObject()
  settings?: InterviewSettingsDto;
}
