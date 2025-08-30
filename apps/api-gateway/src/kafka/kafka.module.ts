import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaService } from '@repo/shared';

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
  ],
  exports: ['KAFKA_SERVICE'],
})
export class KafkaModule {}
