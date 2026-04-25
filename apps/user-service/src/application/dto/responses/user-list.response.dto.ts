/* eslint-disable max-classes-per-file --
 * Application response DTO bundle: paginated list + pagination metadata
 * are co-defined for one query response shape.
 */
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user.response.dto';

/**
 * Pagination Metadata
 */
export class PaginationDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

/**
 * User List Response DTO
 */
export class UserListResponseDto {
  @ApiProperty({ type: () => [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({ type: () => PaginationDto })
  pagination: PaginationDto;
}
