import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, Min, IsUUID } from 'class-validator';
import { InterviewStatus, QuestionType, SessionStatus } from '../types/interview.types';

export class CreateInterviewDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  allowRetake?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimit?: number;

  @IsOptional()
  @IsBoolean()
  requireCandidateInfo?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnCompletion?: boolean;
}

export class UpdateInterviewDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @IsOptional()
  @IsBoolean()
  allowRetake?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimit?: number;

  @IsOptional()
  @IsBoolean()
  requireCandidateInfo?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnCompletion?: boolean;
}

export class CreateQuestionDto {
  @IsString()
  text!: string;

  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsNumber()
  @Min(1)
  orderIndex!: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  timeLimitSeconds?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  orderIndex?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  timeLimitSeconds?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class StartCandidateSessionDto {
  @IsOptional()
  @IsString()
  candidateEmail?: string;

  @IsOptional()
  @IsString()
  candidateName?: string;
}

export class SubmitResponseDto {
  @IsUUID()
  questionId!: string;

  @IsOptional()
  @IsString()
  mediaFileId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationSeconds?: number;
}
