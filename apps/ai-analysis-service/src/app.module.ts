import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ApplicationModule } from './application/application.module';
import { HttpModule } from './infrastructure/http/http.module';
import { KafkaModule } from './infrastructure/kafka/kafka.module';
import { DatabaseModule } from './infrastructure/persistence/database.module';
import { LlmModule } from './infrastructure/llm/llm.module';
import { MetricsModule } from './infrastructure/metrics/metrics.module';
import { CleanupService } from './infrastructure/scheduling/cleanup.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    LlmModule,
    KafkaModule,
    ApplicationModule,
    MetricsModule,
    HttpModule,
  ],
  providers: [CleanupService],
})
export class AppModule {}
