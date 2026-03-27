import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshDto {
  @ApiPropertyOptional({ description: 'Refresh token (if not sent via cookie)' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
