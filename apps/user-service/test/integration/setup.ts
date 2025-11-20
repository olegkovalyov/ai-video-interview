import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../../src/infrastructure/persistence/entities/user.entity';
import { RoleEntity } from '../../src/infrastructure/persistence/entities/role.entity';
import { OutboxEntity } from '../../src/infrastructure/persistence/entities/outbox.entity';
import { SkillCategoryEntity } from '../../src/infrastructure/persistence/entities/skill-category.entity';
import { SkillEntity } from '../../src/infrastructure/persistence/entities/skill.entity';
import { CompanyEntity } from '../../src/infrastructure/persistence/entities/company.entity';
import { UserCompanyEntity } from '../../src/infrastructure/persistence/entities/user-company.entity';
import { CandidateSkillEntity } from '../../src/infrastructure/persistence/entities/candidate-skill.entity';
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
      RoleEntity,
      OutboxEntity,
      SkillCategoryEntity,
      SkillEntity,
      CompanyEntity,
      UserCompanyEntity,
      CandidateSkillEntity,
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
      candidate_skills,
      user_companies,
      companies,
      candidate_profiles,
      users,
      outbox
    RESTART IDENTITY CASCADE;
  `);
  
  // Delete test-created skills (not seeded ones)
  // Seeded skills are preserved by checking created_at > migration date
  // or by explicit patterns. This approach deletes test skills with specific patterns.
  await dataSource.query(`
    DELETE FROM skills 
    WHERE slug LIKE '%-test%'
       OR slug LIKE '%-remove-%'
       OR slug LIKE '%-update-%'
       OR slug LIKE '%-delete-%'
       OR name LIKE '%Test%'
       OR name LIKE '%Elixir%'
       OR name LIKE '%Phoenix%'
       OR name LIKE '%Haskell%'
       OR name LIKE '%Scala%'
       OR name LIKE '%F#%'
       OR name LIKE '%Ember%'
       OR name LIKE '%Preact%'
       OR name LIKE '%Aurelia%'
       OR name LIKE '%Backbone%'
       OR name LIKE '%Bun%'
       OR name LIKE '%Zig%'
       OR name LIKE '%Nim%'
       OR name LIKE '%Svelte Kit%'
       OR name LIKE '%Deno%'
       OR name LIKE '%CockroachDB%'
       OR name LIKE '%Erlang%'
       OR name LIKE '%Clojure%'
       OR name LIKE '%Crystal%'
       OR name LIKE '%CamelCase%'
       OR name LIKE '%Advanced%'
       OR name LIKE '%Expert%'
       OR name LIKE '%Pro%'
       OR name LIKE '%TypeScript Pro%'
       OR name LIKE '%JavaScript Advanced%'
       OR name LIKE '%Python Expert%'
       OR name LIKE '%Test Cache%'
       OR name LIKE '%Test Queue%'
       OR name LIKE '%Test Stream%'
       OR (name IN ('Skill 1', 'Skill 2', 'Full Skill', 'Temp Skill', 'Unassigned Skill'));
  `);
  
  // Note: skill_categories are NOT truncated - they are reference data from seed
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

  // Create user entity manually
  const user = new UserEntity();
  user.id = userId as any;
  user.externalAuthId = externalAuthId;
  user.email = data.email;
  user.firstName = data.firstName;
  user.lastName = data.lastName;
  user.username = data.username as any;
  user.status = (data.status || 'active') as any;
  user.role = (data.role || 'candidate') as any;
  user.createdAt = new Date();
  user.updatedAt = new Date();
  
  await userRepo.save(user);

  return userId;
}

