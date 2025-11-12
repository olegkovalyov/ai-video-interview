import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

/**
 * Add unique constraint on company name
 * Prevents duplicate company names from being created
 */
export class AddCompanyNameUniqueConstraint1730480000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_companies_name_unique',
        columnNames: ['name'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('companies', 'idx_companies_name_unique');
  }
}
