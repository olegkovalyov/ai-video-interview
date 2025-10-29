import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOutboxTable1000000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'outbox',
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
            isUnique: true,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'aggregate_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'published_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Indexes for performance
    await queryRunner.createIndex(
      'outbox',
      new TableIndex({
        name: 'idx_outbox_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'outbox',
      new TableIndex({
        name: 'idx_outbox_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'outbox',
      new TableIndex({
        name: 'idx_outbox_status_created',
        columnNames: ['status', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'outbox',
      new TableIndex({
        name: 'idx_outbox_event_type',
        columnNames: ['event_type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('outbox');
  }
}
