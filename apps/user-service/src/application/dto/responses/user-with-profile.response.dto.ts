import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from './user.response.dto';
import { CandidateProfileResponseDto } from './candidate-profile.response.dto';
import { HRProfileResponseDto } from './hr-profile.response.dto';

/**
 * User With Profile Response DTO
 * Includes user data + their role-specific profile
 */
export class UserWithProfileResponseDto extends UserResponseDto {
  @ApiPropertyOptional({ type: CandidateProfileResponseDto })
  candidateProfile?: CandidateProfileResponseDto;

  @ApiPropertyOptional({ type: HRProfileResponseDto })
  hrProfile?: HRProfileResponseDto;
}
