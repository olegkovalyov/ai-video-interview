import { ApiProperty } from '@nestjs/swagger';

export class InterviewSettingsResponseDto {
  @ApiProperty({ description: 'Total time limit in minutes', example: 60 })
  totalTimeLimit: number;

  @ApiProperty({ description: 'Allow candidates to retake the interview', example: false })
  allowRetakes: boolean;

  @ApiProperty({ description: 'Show timer during interview', example: true })
  showTimer: boolean;

  @ApiProperty({ description: 'Randomize question order', example: false })
  randomizeQuestions: boolean;
}
