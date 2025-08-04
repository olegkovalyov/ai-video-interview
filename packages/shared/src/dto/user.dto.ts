import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { UserStatus } from '../types/user.types';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  fullName!: string;
  companyName?: string;
  phone?: string;
  status!: UserStatus;
  emailVerified!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
