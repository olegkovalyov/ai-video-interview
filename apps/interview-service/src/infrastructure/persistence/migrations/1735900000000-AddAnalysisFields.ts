import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnalysisFields1735900000000 implements MigrationInterface {
  name = 'AddAnalysisFields1735900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ADD COLUMN "analysis_id" uuid NULL,
      ADD COLUMN "analysis_status" varchar(20) NULL,
      ADD COLUMN "analysis_score" int NULL,
      ADD COLUMN "analysis_recommendation" varchar(20) NULL,
      ADD COLUMN "analysis_completed_at" timestamp NULL,
      ADD COLUMN "analysis_error_message" text NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_invitations_analysis_status" ON "invitations" ("analysis_status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_invitations_analysis_status"`);
    
    await queryRunner.query(`
      ALTER TABLE "invitations" 
      DROP COLUMN "analysis_id",
      DROP COLUMN "analysis_status",
      DROP COLUMN "analysis_score",
      DROP COLUMN "analysis_recommendation",
      DROP COLUMN "analysis_completed_at",
      DROP COLUMN "analysis_error_message"
    `);
  }
}
