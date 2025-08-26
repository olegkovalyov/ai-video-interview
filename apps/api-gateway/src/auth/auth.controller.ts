import { Body, Controller, HttpCode, HttpStatus, Inject, OnModuleInit, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthController implements OnModuleInit {
  constructor(
    @Inject('USER_SERVICE_CLIENT') private readonly userClient: ClientKafka,
  ) {}

  onModuleInit() {
    // Subscribe to response topics for RPC
    this.userClient.subscribeToResponseOf('user-commands.register');
    this.userClient.subscribeToResponseOf('auth-commands.login');
    this.userClient.subscribeToResponseOf('auth-commands.refresh');
    // Ensure client is connected
    this.userClient.connect();
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const res$ = this.userClient.send<{ success: boolean; user: any }>('user-commands.register', dto).pipe(timeout(5000));
    const res = await firstValueFrom(res$);
    return res;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const res$ = this.userClient.send<{ success: boolean; tokens: { accessToken: string; refreshToken: string } }>('auth-commands.login', dto).pipe(timeout(5000));
    const res = await firstValueFrom(res$);
    return res;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { userId: string; refreshToken: string }) {
    const res$ = this.userClient
      .send<{ success: boolean; tokens: { accessToken: string; refreshToken: string } }>('auth-commands.refresh', body)
      .pipe(timeout(5000));
    const res = await firstValueFrom(res$);
    return res;
  }
}
