import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/persistence/database.module';
import { KafkaModule } from './infrastructure/kafka/kafka.module';
import { HttpModule } from './infrastructure/http/http.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { MessagingModule } from './infrastructure/messaging/messaging.module';
import { MetricsModule } from './infrastructure/metrics/metrics.module';
import { ApplicationModule } from './application/application.module';
import { TemplatesModule } from './infrastructure/http/modules/templates.module';

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
    MessagingModule, // INBOX/OUTBOX pattern with BullMQ
    
    // Application Layer (CQRS)
    ApplicationModule,
    
    // HTTP (Controllers)
    HttpModule,
    TemplatesModule, // Templates REST API
    
    // Metrics (Prometheus)
    MetricsModule,
  ],
})
export class AppModule {}
