import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuccessResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Optional message',
    example: 'Operation completed successfully',
  })
  message?: string;
}
