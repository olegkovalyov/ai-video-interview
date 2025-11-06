import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema1730900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pgcrypto extension for gen_random_uuid()
    // Note: PostgreSQL 13+ has gen_random_uuid() built-in, but pgcrypto works for all versions
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // ========================================
    // 1. CREATE OUTBOX TABLE
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'outbox',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
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

    // ========================================
    // 2. CREATE INTERVIEW_TEMPLATES TABLE
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'interview_templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'draft'",
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for interview_templates
    await queryRunner.createIndex(
      'interview_templates',
      new TableIndex({
        name: 'idx_created_by',
        columnNames: ['created_by'],
      }),
    );

    await queryRunner.createIndex(
      'interview_templates',
      new TableIndex({
        name: 'idx_status',
        columnNames: ['status'],
      }),
    );

    // ========================================
    // 3. CREATE QUESTIONS TABLE
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'questions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'template_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'text',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'order_number',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'time_limit',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'required',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'hints',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create foreign key for questions -> interview_templates
    await queryRunner.createForeignKey(
      'questions',
      new TableForeignKey({
        name: 'fk_questions_template_id',
        columnNames: ['template_id'],
        referencedTableName: 'interview_templates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create index for template_id
    await queryRunner.createIndex(
      'questions',
      new TableIndex({
        name: 'idx_template_id',
        columnNames: ['template_id'],
      }),
    );

    // Create UNIQUE composite index for template_id + order_number
    // Prevents duplicate question order within the same template (race condition protection)
    await queryRunner.createIndex(
      'questions',
      new TableIndex({
        name: 'idx_template_order_unique',
        columnNames: ['template_id', 'order_number'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key first
    await queryRunner.dropForeignKey('questions', 'fk_questions_template_id');

    // Drop tables in reverse order
    await queryRunner.dropTable('questions', true);
    await queryRunner.dropTable('interview_templates', true);
    await queryRunner.dropTable('outbox', true);

    // Drop extensions
    await queryRunner.query('DROP EXTENSION IF EXISTS "pgcrypto"');
    await queryRunner.query('DROP EXTENSION IF EXISTS "uuid-ossp"');
  }
}
