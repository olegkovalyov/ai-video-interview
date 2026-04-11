import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CallbackQueryDto {
  @ApiProperty({ description: 'Authorization code from Keycloak' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'State parameter for CSRF protection' })
  @IsString()
  state!: string;

  @ApiPropertyOptional({ description: 'Custom redirect URI after auth' })
  @IsOptional()
  @IsString()
  redirect_uri?: string;

  @ApiPropertyOptional({ description: 'Keycloak session state' })
  @IsOptional()
  @IsString()
  session_state?: string;

  @ApiPropertyOptional({ description: 'Keycloak issuer URL' })
  @IsOptional()
  @IsString()
  iss?: string;
}
