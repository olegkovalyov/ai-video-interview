import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaService } from '@repo/shared';
import { AuthEventPublisher } from './producers/auth-event.publisher';
import { UserCommandPublisher } from './producers/user-command.publisher';
import { LoggerService } from '../core/logging/logger.service';
import { TraceService } from '../core/tracing/trace.service';

/**
 * Kafka Module
 * Provides KafkaService and Kafka producers globally
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'KAFKA_SERVICE',
      useFactory: () => {
        return new KafkaService('api-gateway');
      },
    },
    AuthEventPublisher,
    UserCommandPublisher,
    LoggerService,
    TraceService,
  ],
  exports: [
    'KAFKA_SERVICE',
    AuthEventPublisher,
    UserCommandPublisher,
  ],
})
export class KafkaModule {}
