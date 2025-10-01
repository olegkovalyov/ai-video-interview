import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Suspend User DTO
 */
export class SuspendUserDto {
  @ApiProperty({ example: 'Policy violation: spam' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
