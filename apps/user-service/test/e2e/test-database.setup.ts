import { DataSource } from 'typeorm';
import { UserEntity } from '../../src/infrastructure/persistence/entities/user.entity';
import { RoleEntity } from '../../src/infrastructure/persistence/entities/role.entity';
import { OutboxEntity } from '../../src/infrastructure/persistence/entities/outbox.entity';
import { SkillCategoryEntity } from '../../src/infrastructure/persistence/entities/skill-category.entity';
import { SkillEntity } from '../../src/infrastructure/persistence/entities/skill.entity';
import { CompanyEntity } from '../../src/infrastructure/persistence/entities/company.entity';
import { UserCompanyEntity } from '../../src/infrastructure/persistence/entities/user-company.entity';
import { CandidateSkillEntity } from '../../src/infrastructure/persistence/entities/candidate-skill.entity';

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
    database: 'ai_video_interview_user_test', // Test database
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
    synchronize: false,
    logging: false,
  });

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  // Run migrations if not already applied
  await dataSource.runMigrations({ transaction: 'all' });

  return dataSource;
}

/**
 * Clean test database tables
 * Note: skill_categories is not truncated as it contains reference data
 */
export async function cleanE2EDatabase(dataSource: DataSource): Promise<void> {
  if (!dataSource || !dataSource.isInitialized) {
    return;
  }

  try {
    await dataSource.query(`
      TRUNCATE TABLE
        candidate_skills,
        user_companies,
        companies,
        skills,
        candidate_profiles,
        users,
        outbox
      RESTART IDENTITY CASCADE
    `);
  } catch (error) {
    console.warn('E2E cleanup warning:', error.message);
  }
}
