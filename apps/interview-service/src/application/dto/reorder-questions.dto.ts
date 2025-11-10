import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderQuestionsDto {
  @ApiProperty({
    description: 'Array of question IDs in desired order. Must include all questions.',
    example: [
      'q3-uuid-here',
      'q1-uuid-here',
      'q2-uuid-here',
    ],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  questionIds: string[];
}
