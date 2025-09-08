import { Controller, Post, Body, Get, Query, Res, Req, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthentikService } from './authentik.service';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authentikService: AuthentikService,
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
      return await this.authentikService.getJWKS();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
