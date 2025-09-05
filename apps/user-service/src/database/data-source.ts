import { DataSource } from 'typeorm';
import { ProcessedEvent } from '../entities/processed-event.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ai_video_interview_user',
  synchronize: false, // Don't use in production
  logging: process.env.NODE_ENV === 'development',
  entities: [ProcessedEvent],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
