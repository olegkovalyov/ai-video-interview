import { ApiProperty } from '@nestjs/swagger';

/**
 * User Stats Response DTO
 */
export class UserStatsResponseDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  suspendedUsers: number;

  @ApiProperty()
  deletedUsers: number;

  @ApiProperty()
  usersByStatus: Record<string, number>;
}
