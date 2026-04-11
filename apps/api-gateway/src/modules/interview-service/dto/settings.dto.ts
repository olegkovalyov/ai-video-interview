import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * Interview Settings DTO
 */
export class InterviewSettingsDto {
  @ApiProperty({ description: 'Total time limit in minutes', example: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  totalTimeLimit: number;

  @ApiProperty({ description: 'Allow retakes', example: false })
  @IsOptional()
  @IsBoolean()
  allowRetakes: boolean;

  @ApiProperty({ description: 'Show timer', example: true })
  @IsOptional()
  @IsBoolean()
  showTimer: boolean;

  @ApiProperty({ description: 'Randomize questions', example: false })
  @IsOptional()
  @IsBoolean()
  randomizeQuestions: boolean;
}

/**
 * Interview Settings Response DTO
 */
export class InterviewSettingsResponseDto {
  @ApiProperty({ example: 60 })
  totalTimeLimit: number;

  @ApiProperty({ example: false })
  allowRetakes: boolean;

  @ApiProperty({ example: true })
  showTimer: boolean;

  @ApiProperty({ example: false })
  randomizeQuestions: boolean;
}
