import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds HR decision fields to invitations table.
 * After interview completion and AI analysis, HR can approve or reject the candidate.
 * Decision is communicated to the candidate via email and shown in their dashboard.
 */
export class AddInvitationDecisionFields1738200000000
  implements MigrationInterface
{
  name = 'AddInvitationDecisionFields1738200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invitations"
      ADD COLUMN "decision" VARCHAR(20),
      ADD COLUMN "decision_at" TIMESTAMP,
      ADD COLUMN "decision_by" UUID,
      ADD COLUMN "decision_note" TEXT
    `);

    // Index for listing invitations by decision status
    await queryRunner.query(`
      CREATE INDEX "idx_invitations_decision"
      ON "invitations" ("decision")
      WHERE "decision" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_invitations_decision"`);
    await queryRunner.query(`
      ALTER TABLE "invitations"
      DROP COLUMN IF EXISTS "decision",
      DROP COLUMN IF EXISTS "decision_at",
      DROP COLUMN IF EXISTS "decision_by",
      DROP COLUMN IF EXISTS "decision_note"
    `);
  }
}
