import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { OidcService } from './oidc.service';
import { LoggerService } from '../logger/logger.service';

/**
 * Auth Module
 * Provides authentication and authorization services
 */
@Module({
  providers: [
    OidcService,
    JwtAuthGuard,
    RolesGuard,
    LoggerService,
  ],
  exports: [
    OidcService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
