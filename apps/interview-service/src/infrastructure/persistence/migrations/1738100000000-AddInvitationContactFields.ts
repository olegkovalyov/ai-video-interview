import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds denormalized contact info fields to invitations table.
 * These are populated at invitation creation time and included in
 * outbox event payloads so notification-service can send emails
 * without querying user-service (fat event pattern).
 */
export class AddInvitationContactFields1738100000000
  implements MigrationInterface
{
  name = 'AddInvitationContactFields1738100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invitations"
      ADD COLUMN "candidate_email" VARCHAR(255),
      ADD COLUMN "candidate_name" VARCHAR(200),
      ADD COLUMN "hr_email" VARCHAR(255),
      ADD COLUMN "hr_name" VARCHAR(200)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invitations"
      DROP COLUMN IF EXISTS "candidate_email",
      DROP COLUMN IF EXISTS "candidate_name",
      DROP COLUMN IF EXISTS "hr_email",
      DROP COLUMN IF EXISTS "hr_name"
    `);
  }
}
