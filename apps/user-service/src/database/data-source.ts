import { DataSource } from 'typeorm';
import { ProcessedEvent } from '../entities/processed-event.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.USER_SERVICE_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_video_interview_user',
  synchronize: false, // Don't use in production
  logging: process.env.NODE_ENV === 'development',
  entities: [ProcessedEvent],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
