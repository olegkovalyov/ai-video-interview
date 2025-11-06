import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  InterviewTemplateEntity,
  QuestionEntity,
} from '../../src/infrastructure/persistence/entities';
import { OutboxEntity } from '../../src/infrastructure/persistence/entities/outbox.entity';
import { ApplicationModule } from '../../src/application/application.module';
import { DatabaseModule } from '../../src/infrastructure/persistence/database.module';

/**
 * Create PostgreSQL test database connection
 * Uses REAL MIGRATIONS for production-like testing
 * 
 * Strategy:
 * - beforeAll: DROP all tables + Run migrations
 * - afterEach: TRUNCATE tables (keep schema)
 */
export async function createTestDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: 'ai_video_interview_interview_test', // ← Test database
    entities: [InterviewTemplateEntity, QuestionEntity, OutboxEntity],
    migrations: ['src/infrastructure/persistence/migrations/*.ts'],
    synchronize: false, // NEVER use synchronize in tests
    logging: false,
  });

  await dataSource.initialize();
  
  // DROP all tables + Create extensions + Run migrations
  await dropAllTables(dataSource);
  await createExtensions(dataSource);
  await dataSource.runMigrations();
  
  console.log('✅ Test database initialized with migrations');
  
  return dataSource;
}

/**
 * Drop all tables in test database
 * Called once before running migrations
 */
async function dropAllTables(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
  `);
}

/**
 * Create required PostgreSQL extensions
 * Called after schema creation, before migrations
 * Using gen_random_uuid() from pgcrypto (works with all PostgreSQL versions)
 */
async function createExtensions(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  `);
}

/**
 * Setup test NestJS application with test database
 */
export async function setupTestApp(
  dataSource: DataSource,
): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true, // Don't load .env in tests
      }),
      CqrsModule,
      DatabaseModule, // Import full DatabaseModule
      ApplicationModule,
    ],
  })
    // Override DataSource with our test instance
    .overrideProvider(DataSource)
    .useValue(dataSource)
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return app;
}

/**
 * Clean all data from test database using TRUNCATE
 * Called after EACH test to ensure clean state
 * Keeps schema intact (no DROP, just data cleanup)
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  // TRUNCATE all tables at once (faster than DELETE)
  // CASCADE removes data from dependent tables
  // RESTART IDENTITY resets auto-increment counters
  await dataSource.query(`
    TRUNCATE TABLE 
      questions,
      interview_templates,
      outbox
    RESTART IDENTITY CASCADE;
  `);
}

/**
 * Seed test data helper
 * Note: Use UUIDs for id and createdBy
 */
export async function seedTemplate(
  dataSource: DataSource,
  data: {
    id?: string; // Optional, will generate UUID if not provided
    title: string;
    description: string;
    createdBy?: string; // Optional, will generate UUID if not provided
    status?: string;
    questionsCount?: number;
  },
): Promise<string> {
  const templateRepo = dataSource.getRepository(InterviewTemplateEntity);
  const questionRepo = dataSource.getRepository(QuestionEntity);

  // Generate UUIDs if not provided
  const templateId = data.id || uuidv4();
  const createdBy = data.createdBy || uuidv4();

  // Create template
  const template = templateRepo.create({
    id: templateId,
    title: data.title,
    description: data.description,
    createdBy,
    status: data.status || 'draft',
    settings: {
      totalTimeLimit: 60,
      allowRetakes: false,
      showTimer: true,
      randomizeQuestions: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await templateRepo.save(template);

  // Create questions
  const questionsCount = data.questionsCount || 0;
  for (let i = 1; i <= questionsCount; i++) {
    const question = questionRepo.create({
      id: uuidv4(), // Generate UUID for each question
      templateId: templateId,
      text: `Question ${i}?`,
      type: 'video',
      order: i,
      timeLimit: 60,
      required: true,
      hints: null,
      createdAt: new Date(),
    });
    await questionRepo.save(question);
  }
  
  return templateId;
}
