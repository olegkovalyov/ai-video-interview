import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitialSchema1730800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create outbox table for INBOX/OUTBOX pattern
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
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '255',
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
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'published_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'idx_outbox_status',
            columnNames: ['status'],
          },
          {
            name: 'idx_outbox_created_at',
            columnNames: ['created_at'],
          },
          {
            name: 'idx_outbox_status_created',
            columnNames: ['status', 'created_at'],
          },
          {
            name: 'idx_outbox_event_type',
            columnNames: ['event_type'],
          },
        ],
      }),
      true,
    );

    // Enable UUID extension if not already enabled
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('outbox', true);
  }
}
