import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthKafkaController {
  constructor(private readonly auth: AuthService) {}

  @MessagePattern('user-commands.register')
  async register(
    @Payload() payload: RegisterDto,
  ): Promise<{ success: true; user: { id: string; email: string; name: string | null } }> {
    const user = await this.auth.register(payload.email, payload.password, payload.name);
    return { success: true, user };
  }

  @MessagePattern('auth-commands.login')
  async login(
    @Payload() payload: LoginDto,
  ): Promise<{ success: true; tokens: { accessToken: string; refreshToken: string } }> {
    const tokens = await this.auth.login(payload.email, payload.password);
    return { success: true, tokens };
  }

  @MessagePattern('auth-commands.refresh')
  async refresh(
    @Payload() payload: RefreshDto,
  ): Promise<{ success: true; tokens: { accessToken: string; refreshToken: string } }> {
    const tokens = await this.auth.refresh(payload.userId, payload.refreshToken);
    return { success: true, tokens };
  }
}
