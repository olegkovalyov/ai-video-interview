import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/persistence/database.module';
import { ApplicationModule } from './application/application.module';
import { KafkaModule } from './infrastructure/kafka/kafka.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { HttpModule } from './infrastructure/http/http.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { MessagingModule } from './infrastructure/messaging/messaging.module';
import { MetricsModule } from './infrastructure/metrics/metrics.module';
import { MetricsInterceptor } from './infrastructure/metrics/metrics.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Logging (Global)
    LoggerModule,
    
    // Infrastructure
    DatabaseModule,
    KafkaModule,
    StorageModule,
    MessagingModule, // INBOX/OUTBOX pattern with BullMQ
    
    // Application (CQRS)
    ApplicationModule,
    
    // HTTP (Controllers)
    HttpModule,
    
    // Metrics (Prometheus)
    MetricsModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule {}
