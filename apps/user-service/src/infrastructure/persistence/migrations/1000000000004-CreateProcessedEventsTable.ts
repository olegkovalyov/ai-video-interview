import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateProcessedEventsTable1000000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'processed_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'event_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'service_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'processed_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create unique constraint for idempotency
    await queryRunner.createIndex(
      'processed_events',
      new TableIndex({
        name: 'idx_processed_events_unique',
        columnNames: ['event_id', 'service_name'],
        isUnique: true,
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'processed_events',
      new TableIndex({
        name: 'idx_processed_events_event_id',
        columnNames: ['event_id'],
      }),
    );

    await queryRunner.createIndex(
      'processed_events',
      new TableIndex({
        name: 'idx_processed_events_service_name',
        columnNames: ['service_name'],
      }),
    );

    await queryRunner.createIndex(
      'processed_events',
      new TableIndex({
        name: 'idx_processed_events_processed_at',
        columnNames: ['processed_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('processed_events');
  }
}
