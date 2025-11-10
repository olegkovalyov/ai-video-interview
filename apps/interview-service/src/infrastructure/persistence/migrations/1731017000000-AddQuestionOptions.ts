import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add options column for multiple choice questions
 * 
 * Adds a JSONB column to store multiple choice question options.
 * Structure: { id: string, text: string, isCorrect: boolean }[]
 * 
 * NULL for video/text questions
 * JSONB for multiple_choice questions with 2+ options
 */
export class AddQuestionOptions1731017000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'questions',
      new TableColumn({
        name: 'options',
        type: 'jsonb',
        isNullable: true,
        default: null,
        comment: 'Multiple choice question options (JSONB array)',
      }),
    );

    // Create index for queries filtering by options existence
    await queryRunner.query(
      `CREATE INDEX idx_questions_options_not_null ON questions ((options IS NOT NULL))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_questions_options_not_null`);
    await queryRunner.dropColumn('questions', 'options');
  }
}
