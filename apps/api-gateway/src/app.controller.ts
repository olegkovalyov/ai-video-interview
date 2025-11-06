import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtRefreshGuard } from './core/auth/guards/jwt-refresh.guard';
import { Request } from 'express';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello from API Gateway!';
  }

  @UseGuards(JwtRefreshGuard)
  @Get('protected')
  getProtected(@Req() req: Request & { user?: any }): { message: string; timestamp: string; user: any } {
    return {
      message: 'This is a protected route! Your JWT is valid.',
      timestamp: new Date().toISOString(),
      user: req.user || null,
    };
  }
}
