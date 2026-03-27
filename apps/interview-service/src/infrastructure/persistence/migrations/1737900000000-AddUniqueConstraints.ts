import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add unique constraints to prevent concurrent duplicate insertions:
 * 1. questions(template_id, order_number) — prevents duplicate question order per template
 * 2. responses(invitation_id, question_id) — prevents duplicate response per question per invitation
 */
export class AddUniqueConstraints1737900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE questions
      ADD CONSTRAINT uq_questions_template_order
      UNIQUE (template_id, order_number)
    `);

    await queryRunner.query(`
      ALTER TABLE responses
      ADD CONSTRAINT uq_responses_invitation_question
      UNIQUE (invitation_id, question_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE responses
      DROP CONSTRAINT IF EXISTS uq_responses_invitation_question
    `);

    await queryRunner.query(`
      ALTER TABLE questions
      DROP CONSTRAINT IF EXISTS uq_questions_template_order
    `);
  }
}
