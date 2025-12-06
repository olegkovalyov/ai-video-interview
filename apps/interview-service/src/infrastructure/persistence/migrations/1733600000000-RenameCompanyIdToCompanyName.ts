import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameCompanyIdToCompanyName1733600000000 implements MigrationInterface {
  name = 'RenameCompanyIdToCompanyName1733600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new column company_name
    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ADD COLUMN "company_name" varchar(200)
    `);

    // Step 2: Copy data from company_id to company_name (as string)
    // Since company_id was UUID, we convert it to text temporarily
    // In production, you might want to join with companies table to get actual names
    await queryRunner.query(`
      UPDATE "invitations" 
      SET "company_name" = "company_id"::text
    `);

    // Step 3: Make company_name NOT NULL
    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ALTER COLUMN "company_name" SET NOT NULL
    `);

    // Step 4: Drop old company_id column
    await queryRunner.query(`
      ALTER TABLE "invitations" 
      DROP COLUMN "company_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add company_id column back
    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ADD COLUMN "company_id" uuid
    `);

    // Step 2: Try to convert company_name back to UUID (will fail if it's not a valid UUID)
    // For safety, generate new UUIDs
    await queryRunner.query(`
      UPDATE "invitations" 
      SET "company_id" = gen_random_uuid()
    `);

    // Step 3: Make company_id NOT NULL
    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ALTER COLUMN "company_id" SET NOT NULL
    `);

    // Step 4: Drop company_name column
    await queryRunner.query(`
      ALTER TABLE "invitations" 
      DROP COLUMN "company_name"
    `);
  }
}
