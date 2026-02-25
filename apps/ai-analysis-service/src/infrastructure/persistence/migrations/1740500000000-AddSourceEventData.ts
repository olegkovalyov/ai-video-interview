import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSourceEventData1740500000000 implements MigrationInterface {
  name = 'AddSourceEventData1740500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "analysis_results" ADD COLUMN "source_event_data" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "analysis_results" DROP COLUMN "source_event_data"
    `);
  }
}
