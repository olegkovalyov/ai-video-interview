import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from './infrastructure/http/http.module';
import { KafkaModule } from './infrastructure/kafka/kafka.module';
import { DatabaseModule } from './infrastructure/persistence/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    HttpModule,
    KafkaModule,
  ],
})
export class AppModule {}
