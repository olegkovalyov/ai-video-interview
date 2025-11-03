import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seed Roles Migration
 * Creates base roles: admin, hr, candidate
 */
export class SeedRoles1730460000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO roles (id, name, display_name, description, permissions, created_at, updated_at)
      VALUES
        (
          uuid_generate_v4(),
          'admin',
          'Administrator',
          'Full system access - can manage users, roles, and all system settings',
          '["*"]'::jsonb,
          NOW(),
          NOW()
        ),
        (
          uuid_generate_v4(),
          'hr',
          'HR Manager',
          'Manage interviews, candidates, and hiring process',
          '["users:read", "users:create", "interviews:*", "candidates:*"]'::jsonb,
          NOW(),
          NOW()
        ),
        (
          uuid_generate_v4(),
          'candidate',
          'Candidate',
          'Take interviews and view own results',
          '["profile:update", "interviews:view"]'::jsonb,
          NOW(),
          NOW()
        )
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('✅ Seeded 3 base roles: admin, hr, candidate');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM roles WHERE name IN ('admin', 'hr', 'candidate');
    `);

    console.log('✅ Removed seeded roles');
  }
}
