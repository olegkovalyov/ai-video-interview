import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../../src/infrastructure/persistence/entities/user.entity';
import { CandidateProfileEntity } from '../../src/infrastructure/persistence/entities/candidate-profile.entity';
import { HRProfileEntity } from '../../src/infrastructure/persistence/entities/hr-profile.entity';
import { OutboxEntity } from '../../src/infrastructure/persistence/entities/outbox.entity';
import { TestApplicationModule } from './test-application.module';
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
    database: 'ai_video_interview_user_test', // ← Test database
    entities: [
      UserEntity,
      CandidateProfileEntity,
      HRProfileEntity,
      OutboxEntity,
    ],
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
 * WITHOUT Kafka (using TestApplicationModule)
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
      DatabaseModule, // Import DatabaseModule for repositories
      TestApplicationModule, // Use test module WITHOUT Kafka
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
      users,
      candidate_profiles,
      hr_profiles,
      outbox
    RESTART IDENTITY CASCADE;
  `);
}

/**
 * Seed test data helper - Create user
 * Note: Use UUIDs for id and externalAuthId
 */
export async function seedUser(
  dataSource: DataSource,
  data: {
    id?: string; // Optional, will generate UUID if not provided
    externalAuthId?: string; // Optional, will generate UUID if not provided
    email: string;
    firstName: string;
    lastName: string;
    username?: string;
    status?: string;
    role?: string;
  },
): Promise<string> {
  const userRepo = dataSource.getRepository(UserEntity);

  // Generate UUIDs if not provided
  const userId = data.id || uuidv4();
  const externalAuthId = data.externalAuthId || uuidv4();

  // Create user
  const user = userRepo.create({
    id: userId,
    externalAuthId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username || null,
    status: data.status || 'active',
    role: data.role || 'candidate',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await userRepo.save(user);

  return userId;
}

