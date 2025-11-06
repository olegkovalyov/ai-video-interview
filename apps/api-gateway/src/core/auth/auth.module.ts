import { Module, Global, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './controllers/auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthErrorInterceptor } from './interceptors/auth-error.interceptor';
import {
  AuthOrchestrator,
  SessionManager,
  AuthEventPublisher,
  RedirectUriHelper,
} from './services';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { CookieService } from './services/cookie.service';
import { OidcService } from './services/oidc.service';
import { KeycloakService } from './services/keycloak.service';
import { RegistrationSaga } from './sagas/registration.saga';
import { UserServiceModule } from '../../modules/user-service/user-service.module';

/**
 * Auth Module
 * Provides authentication and authorization services globally
 * 
 * @Global - Available to all modules without explicit import
 * 
 * Services:
 * - AuthOrchestrator: Main auth orchestration
 * - SessionManager: Session management
 * - TokenService: JWT token operations
 * - OidcService: OIDC discovery
 * - KeycloakService: Keycloak integration
 * - RegistrationSaga: Ensure user exists on login
 * 
 * Guards:
 * - JwtAuthGuard: JWT validation
 * - JwtRefreshGuard: Refresh token validation
 * - RolesGuard: Role-based access control
 * 
 * Interceptors:
 * - AuthErrorInterceptor: Auth error handling
 */
@Global()
@Module({
  imports: [
    HttpModule,
    forwardRef(() => UserServiceModule),
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    // Services
    AuthService,
    TokenService,
    CookieService,
    OidcService,
    KeycloakService,
    
    // New auth services
    AuthOrchestrator,
    SessionManager,
    AuthEventPublisher,
    RedirectUriHelper,
    
    // Guards
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,
    
    // Interceptors
    AuthErrorInterceptor,
    
    // Sagas
    RegistrationSaga,
  ],
  exports: [
    // Services
    AuthService,
    TokenService,
    CookieService,
    OidcService,
    KeycloakService,
    AuthOrchestrator,
    SessionManager,
    AuthEventPublisher,
    RedirectUriHelper,
    
    // Guards
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,
    
    // Interceptors
    AuthErrorInterceptor,
    
    // Sagas
    RegistrationSaga,
  ],
})
export class AuthModule {}
