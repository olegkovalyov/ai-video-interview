import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaService } from '@repo/shared';
import { UserEventConsumerService } from './user-event-consumer.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'KAFKA_SERVICE',
      useFactory: () => {
        return new KafkaService('user-service');
      },
    },
    UserEventConsumerService,
  ],
  exports: ['KAFKA_SERVICE', UserEventConsumerService],
})
export class KafkaModule {}
