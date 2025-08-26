import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth/.well-known')
export class JwksController {
  constructor(private readonly auth: AuthService) {}

  @Get('jwks.json')
  getJwks() {
    return this.auth.getJwks();
  }
}
