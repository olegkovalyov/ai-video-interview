import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop hr_profiles table - it was never used in code
 * HR profile data will be stored in user_companies (position, company relation)
 */
export class DropHrProfilesTable1733512800000 implements MigrationInterface {
  name = 'DropHrProfilesTable1733512800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop hr_profiles table (it has no data and no code using it)
    await queryRunner.query(`DROP TABLE IF EXISTS hr_profiles CASCADE`);
    
    console.log('✅ Dropped unused hr_profiles table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate hr_profiles table if needed
    await queryRunner.query(`
      CREATE TABLE hr_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255),
        position VARCHAR(255),
        department VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Recreated hr_profiles table');
  }
}
