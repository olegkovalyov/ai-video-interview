import { IsString, IsEmail, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating user via internal HTTP endpoint
 * Called by API Gateway during Saga orchestration
 */
export class CreateUserInternalDto {
  @ApiProperty({
    description: 'Internal user ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'External authentication provider ID (e.g., Keycloak sub)',
    example: 'auth0|507f1f77bcf86cd799439011',
  })
  @IsString()
  externalAuthId: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;
}
