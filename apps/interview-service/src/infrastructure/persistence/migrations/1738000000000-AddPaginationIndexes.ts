import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaginationIndexes1738000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX idx_invitations_created_at ON invitations (created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_templates_created_at ON interview_templates (created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_templates_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invitations_created_at`);
  }
}
