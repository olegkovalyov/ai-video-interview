import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from './logger/logger.module';
import { HealthController } from './health/health.controller';

/**
 * Interview Service - Main Module
 * 
 * Минимальная конфигурация без лишних зависимостей
 * - Логирование в консоль и Grafana (Winston + Loki)
 * - Health checks
 * - Готов к добавлению бизнес-логики
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
