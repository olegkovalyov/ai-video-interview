import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OutboxEntity } from './entities/outbox.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: parseInt(configService.get('DATABASE_PORT', '5432'), 10),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'ai_video_interview_interview'),
        entities: [OutboxEntity], // Interview entities will be added later
        synchronize: false, // Always use migrations
        logging: false, // Disable SQL logging (too verbose)
        ssl: configService.get('DATABASE_SSL', 'false') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([OutboxEntity]),
  ],
  providers: [],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
