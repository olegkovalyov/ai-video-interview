import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';
import { AuthKafkaController } from './auth.kafka.controller';
import { JwksController } from './jwks.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({}),
  ],
  providers: [AuthService],
  controllers: [AuthKafkaController, JwksController],
  exports: [AuthService],
})
export class AuthModule {}
