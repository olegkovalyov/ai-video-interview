import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaginationIndexes1744000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX idx_analysis_results_created_at ON analysis_results (created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_analysis_results_created_at`,
    );
  }
}
