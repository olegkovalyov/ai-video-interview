import { DataSource } from 'typeorm';
import {
  InterviewTemplateEntity,
  QuestionEntity,
} from '../../src/infrastructure/persistence/entities';
import { OutboxEntity } from '../../src/infrastructure/persistence/entities/outbox.entity';

/**
 * Create test DataSource for E2E tests
 * Uses same approach as integration tests
 */
export async function createE2EDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: 'ai_video_interview_interview_test', // Test database
    entities: [InterviewTemplateEntity, QuestionEntity, OutboxEntity],
    migrations: ['src/infrastructure/persistence/migrations/*.ts'],
    synchronize: false,
    logging: false,
  });

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
}

/**
 * Clean test database tables
 */
export async function cleanE2EDatabase(dataSource: DataSource): Promise<void> {
  if (!dataSource || !dataSource.isInitialized) {
    return;
  }

  try {
    await dataSource.query(`
      TRUNCATE TABLE 
        questions,
        interview_templates,
        outbox
      RESTART IDENTITY CASCADE
    `);
  } catch (error) {
    console.warn('E2E cleanup warning:', error.message);
  }
}
