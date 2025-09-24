import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaModule } from './kafka/kafka.module';
import { ProcessedEvent } from './entities/processed-event.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.USER_SERVICE_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_video_interview_user',
      entities: [ProcessedEvent],
      synchronize: false, // Use migrations instead
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([ProcessedEvent]),
    KafkaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
