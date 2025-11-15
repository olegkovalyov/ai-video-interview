import { ApiProperty } from '@nestjs/swagger';

/**
 * Interview Settings DTO
 * Configures interview behavior and constraints
 */
export class InterviewSettingsDto {
  @ApiProperty({
    description: 'Total time limit for the interview in minutes',
    example: 60,
    minimum: 1,
    maximum: 480,
  })
  totalTimeLimit: number;

  @ApiProperty({
    description: 'Allow candidates to retake the interview',
    example: false,
  })
  allowRetakes: boolean;

  @ApiProperty({
    description: 'Show timer to candidates during interview',
    example: true,
  })
  showTimer: boolean;

  @ApiProperty({
    description: 'Randomize question order for each candidate',
    example: false,
  })
  randomizeQuestions: boolean;
}

/**
 * Interview Settings Response DTO
 */
export class InterviewSettingsResponseDto {
  @ApiProperty({
    description: 'Total time limit in minutes',
    example: 60,
  })
  totalTimeLimit: number;

  @ApiProperty({
    description: 'Allow candidates to retake the interview',
    example: false,
  })
  allowRetakes: boolean;

  @ApiProperty({
    description: 'Show timer during interview',
    example: true,
  })
  showTimer: boolean;

  @ApiProperty({
    description: 'Randomize question order',
    example: false,
  })
  randomizeQuestions: boolean;
}
