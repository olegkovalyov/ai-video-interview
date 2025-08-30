import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Request } from 'express';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello from API Gateway!';
  }

  @UseGuards(JwtAuthGuard)
  @Get('protected')
  getProtected(@Req() req: Request & { user?: any }): { message: string; timestamp: string; user: any } {
    return {
      message: 'This is a protected route! Your JWT is valid.',
      timestamp: new Date().toISOString(),
      user: req.user || null,
    };
  }
}
