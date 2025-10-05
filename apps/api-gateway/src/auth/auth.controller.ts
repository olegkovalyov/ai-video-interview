import { Controller, Post, Body, Get, Query, Res, Req, HttpStatus, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { KeycloakService } from './keycloak.service';
import { JwtAuthGuard } from './jwt-auth.guard';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly keycloakService: KeycloakService,
  ) {}


  @Post('logout')
  async logout(
    @Body() body: { accessToken?: string; refreshToken?: string; idToken?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.authService.logout(req, res, body);
    return res.json(result);
  }

  @Get('login')
  async initiateLogin(@Query('redirect_uri') redirectUri?: string) {
    return await this.authService.initiateLogin(redirectUri);
  }

  @Get('register')
  async initiateRegister(@Query('redirect_uri') redirectUri?: string) {
    return await this.authService.initiateRegister(redirectUri);
  }

  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('redirect_uri') redirectUri?: string,
    @Res() res?: Response
  ) {
    const result = await this.authService.handleCallback(code, state, redirectUri, res!);
    
    if (result.success) {
      return res!.json(result);
    } else {
      return res!.status(HttpStatus.BAD_REQUEST).json(result);
    }
  }


  @Post('refresh')
  async refresh(
    @Body() body: { refreshToken?: string } | undefined,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.refreshTokens(req, res, body?.refreshToken);
    
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json(result);
    }
  }

  @Get('jwks')
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

  /**
   * Change password (MVP - simplified without current password check)
   * POST /api/auth/change-password
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: Request,
    @Body() body: { newPassword: string },
    @Res() res: Response,
  ) {
    try {
      const userId = (req as any).user?.sub; // Keycloak User ID
      
      if (!userId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      if (!body.newPassword || body.newPassword.length < 8) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Password must be at least 8 characters long',
        });
      }

      // Change password in Keycloak (simplified for MVP)
      await this.keycloakService.updatePassword(userId, body.newPassword);

      return res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message || 'Failed to change password',
      });
    }
  }
}
