import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRoleEnum {
  CANDIDATE = 'candidate',
  HR = 'hr',
  ADMIN = 'admin',
}

/**
 * Select Role DTO
 * User selects their role (one-time operation)
 * Admin role can only be selected via internal/admin endpoints
 */
export class SelectRoleDto {
  @ApiProperty({
    description: 'User role to assign',
    enum: UserRoleEnum,
    example: UserRoleEnum.CANDIDATE,
  })
  @IsEnum(UserRoleEnum, {
    message: 'Role must be "candidate", "hr", or "admin"',
  })
  role: UserRoleEnum;
}
