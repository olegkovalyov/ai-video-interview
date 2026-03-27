import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Res,
  Req,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle, SkipThrottle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from '../services/auth.service';
import { KeycloakService } from '../services/keycloak.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoggerService } from '../../logging/logger.service';
import { LogoutDto } from '../dto/logout.dto';
import { RefreshDto } from '../dto/refresh.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { CallbackQueryDto } from '../dto/callback-query.dto';

@ApiTags('Authentication')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly keycloakService: KeycloakService,
    private readonly loggerService: LoggerService,
  ) {}

  @Post('logout')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Logout user',
    description: 'Revoke tokens and clear session cookies',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Body() body: LogoutDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.authService.logout(req, res, body);
    return res.json(result);
  }

  @Get('login')
  @Throttle({ short: { limit: 10, ttl: 60000 }, long: { limit: 50, ttl: 3600000 } })
  @ApiOperation({
    summary: 'Initiate OAuth2 login',
    description: 'Returns Keycloak authorization URL',
  })
  @ApiQuery({
    name: 'redirect_uri',
    required: false,
    description: 'Custom redirect URI after login',
  })
  @ApiResponse({ status: 200, description: 'Authorization URL returned' })
  async initiateLogin(@Query('redirect_uri') redirectUri?: string) {
    return await this.authService.initiateLogin(redirectUri);
  }

  @Get('register')
  @Throttle({ short: { limit: 5, ttl: 60000 }, long: { limit: 3, ttl: 3600000 } })
  @ApiOperation({
    summary: 'Initiate OAuth2 registration',
    description: 'Returns Keycloak registration URL',
  })
  @ApiQuery({
    name: 'redirect_uri',
    required: false,
    description: 'Custom redirect URI after registration',
  })
  @ApiResponse({ status: 200, description: 'Registration URL returned' })
  async initiateRegister(@Query('redirect_uri') redirectUri?: string) {
    return await this.authService.initiateRegister(redirectUri);
  }

  @Get('callback')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'OAuth2 callback',
    description:
      'Handles Keycloak callback, exchanges authorization code for tokens',
  })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 400, description: 'Invalid callback parameters' })
  async handleCallback(
    @Query() query: CallbackQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.handleCallback(
      query.code,
      query.state,
      query.redirect_uri,
      res,
    );

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json(result);
    }
  }

  @Post('refresh')
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Refresh access token using refresh token from cookie or body',
  })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or missing refresh token',
  })
  async refresh(
    @Body() body: RefreshDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.refreshTokens(
      req,
      res,
      body?.refreshToken,
    );

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json(result);
    }
  }

  @Get('jwks')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get JWKS',
    description: 'Returns JSON Web Key Set for token verification',
  })
  @ApiResponse({ status: 200, description: 'JWKS returned successfully' })
  async getJWKS() {
    try {
      return await this.keycloakService.getJWKS();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Change password',
    description: 'Change user password (requires authentication)',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Req() req: Request,
    @Body() body: ChangePasswordDto,
    @Res() res: Response,
  ) {
    try {
      const userId = (req as any).user?.sub;

      if (!userId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      await this.keycloakService.updatePassword(userId, body.newPassword);

      return res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      this.loggerService.error('Failed to change password', error, {
        action: 'change_password_failed',
      });
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message || 'Failed to change password',
      });
    }
  }
}
