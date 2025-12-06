import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvitationsAndResponses1733500000000 implements MigrationInterface {
  name = 'CreateInvitationsAndResponses1733500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create invitations table
    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "template_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "invited_by" uuid NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "allow_pause" boolean NOT NULL DEFAULT true,
        "show_timer" boolean NOT NULL DEFAULT true,
        "expires_at" timestamp NOT NULL,
        "started_at" timestamp,
        "completed_at" timestamp,
        "last_activity_at" timestamp,
        "completed_reason" varchar(20),
        "total_questions" int NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "pk_invitations" PRIMARY KEY ("id"),
        CONSTRAINT "fk_invitations_template" FOREIGN KEY ("template_id") 
          REFERENCES "interview_templates"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_invitation_candidate_template" UNIQUE ("candidate_id", "template_id")
      )
    `);

    // Create indexes for invitations
    await queryRunner.query(`
      CREATE INDEX "idx_invitations_candidate_id" ON "invitations" ("candidate_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_invitations_invited_by" ON "invitations" ("invited_by")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_invitations_template_id" ON "invitations" ("template_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_invitations_status" ON "invitations" ("status")
    `);

    // Create responses table
    await queryRunner.query(`
      CREATE TABLE "responses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "invitation_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "question_index" int NOT NULL,
        "question_text" text NOT NULL,
        "response_type" varchar(20) NOT NULL,
        "text_answer" text,
        "code_answer" text,
        "video_url" text,
        "duration" int NOT NULL DEFAULT 0,
        "submitted_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "pk_responses" PRIMARY KEY ("id"),
        CONSTRAINT "fk_responses_invitation" FOREIGN KEY ("invitation_id") 
          REFERENCES "invitations"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_response_invitation_question" UNIQUE ("invitation_id", "question_id")
      )
    `);

    // Create indexes for responses
    await queryRunner.query(`
      CREATE INDEX "idx_responses_invitation_id" ON "responses" ("invitation_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop responses table first (due to FK)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_responses_invitation_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "responses"`);

    // Drop invitations table
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_invitations_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_invitations_template_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_invitations_invited_by"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_invitations_candidate_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invitations"`);
  }
}
