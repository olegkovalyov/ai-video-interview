import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/persistence/database.module';
import { ApplicationModule } from './application/application.module';
import { KafkaModule } from './infrastructure/kafka/kafka.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { HttpModule } from './infrastructure/http/http.module';
import { LoggerModule } from './infrastructure/logger/logger.module';

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
    
    // Application (CQRS)
    ApplicationModule,
    
    // HTTP (Controllers)
    HttpModule,
  ],
})
export class AppModule {}
