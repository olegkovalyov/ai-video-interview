import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateInboxTable1000000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inbox',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'message_id',
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
            name: 'processed_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Indexes for performance
    await queryRunner.createIndex(
      'inbox',
      new TableIndex({
        name: 'idx_inbox_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'inbox',
      new TableIndex({
        name: 'idx_inbox_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'inbox',
      new TableIndex({
        name: 'idx_inbox_status_created',
        columnNames: ['status', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inbox');
  }
}
