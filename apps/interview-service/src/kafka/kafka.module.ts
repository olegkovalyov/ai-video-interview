import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaService } from '@repo/shared';
import { UserEventConsumerService } from './user-event-consumer.service';
import { EventIdempotencyService } from './event-idempotency.service';
import { ProcessedEvent } from '../entities/processed-event.entity';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ProcessedEvent]),
  ],
  providers: [
    {
      provide: 'KAFKA_SERVICE',
      useFactory: () => {
        return new KafkaService('interview-service');
      },
    },
    EventIdempotencyService,
    UserEventConsumerService,
  ],
  exports: ['KAFKA_SERVICE', EventIdempotencyService, UserEventConsumerService],
})
export class KafkaModule {}
