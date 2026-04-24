import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop username column from users table - it was never used in code
 * Username is stored in Keycloak, not in user-service
 */
export class DropUsernameColumn1733513400000 implements MigrationInterface {
  name = 'DropUsernameColumn1733513400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop unique index first
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_username"`);

    // Drop the column
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS username`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the column
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN username VARCHAR(100) UNIQUE
    `);

    // Recreate index
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_users_username" ON users(username) WHERE username IS NOT NULL
    `);
  }
}
