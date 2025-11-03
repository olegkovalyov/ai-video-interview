import { IsString, IsEmail, IsUUID } from 'class-validator';

/**
 * DTO for creating user via internal HTTP endpoint
 * Called by API Gateway during Saga orchestration
 */
export class CreateUserInternalDto {
  @IsUUID()
  userId: string;

  @IsString()
  externalAuthId: string;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}
