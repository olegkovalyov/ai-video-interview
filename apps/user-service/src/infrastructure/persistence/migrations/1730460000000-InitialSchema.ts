import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Initial Schema Migration
 * Creates all tables for User Service with role-based profiles
 */
export class InitialSchema1730460000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ============================================
    // 1. USERS TABLE
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'external_auth_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'avatar_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'timezone',
            type: 'varchar',
            length: '50',
            default: "'UTC'",
          },
          {
            name: 'language',
            type: 'varchar',
            length: '10',
            default: "'en'",
          },
          {
            name: 'email_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
            default: "'pending'",
            isNullable: false,
            comment: 'User role: pending, candidate, hr, admin (immutable after selection)',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'suspended', 'deleted'],
            default: "'active'",
          },
          {
            name: 'last_login_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
          },
        ],
      }),
      true,
    );

    // Users indexes
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_external_auth_id',
        columnNames: ['external_auth_id'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_role',
        columnNames: ['role'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_created_at',
        columnNames: ['created_at'],
      }),
    );

    // ============================================
    // 2. CANDIDATE_PROFILES TABLE
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'candidate_profiles',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'skills',
            type: 'text[]',
            default: "'{}'",
            isNullable: false,
            comment: 'Array of candidate skills (e.g., JavaScript, React)',
          },
          {
            name: 'experience_level',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'junior, mid, senior, lead',
          },
          {
            name: 'is_profile_complete',
            type: 'boolean',
            default: false,
            comment: 'True if skills and experience are filled',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign key to users
    await queryRunner.createForeignKey(
      'candidate_profiles',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // GIN index for skills array search
    await queryRunner.query(`
      CREATE INDEX idx_candidate_profiles_skills 
      ON candidate_profiles USING GIN(skills);
    `);

    await queryRunner.createIndex(
      'candidate_profiles',
      new TableIndex({
        name: 'idx_candidate_profiles_experience',
        columnNames: ['experience_level'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_profiles',
      new TableIndex({
        name: 'idx_candidate_profiles_complete',
        columnNames: ['is_profile_complete'],
      }),
    );

    // ============================================
    // 3. HR_PROFILES TABLE
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'hr_profiles',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'company_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'e.g., HR Manager, Recruiter',
          },
          {
            name: 'is_profile_complete',
            type: 'boolean',
            default: false,
            comment: 'True if company and position are filled',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign key to users
    await queryRunner.createForeignKey(
      'hr_profiles',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // ============================================
    // 4. OUTBOX TABLE (OUTBOX Pattern - Reliable Publishing)
    // ============================================
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
            length: '100',
            isNullable: false,
          },
          {
            name: 'aggregate_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'publishing', 'published', 'failed'],
            default: "'pending'",
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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
        name: 'idx_outbox_aggregate_id',
        columnNames: ['aggregate_id'],
      }),
    );

    console.log('✅ Created all tables: users, candidate_profiles, hr_profiles, outbox');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order
    await queryRunner.dropTable('outbox', true);
    await queryRunner.dropTable('hr_profiles', true);
    await queryRunner.dropTable('candidate_profiles', true);
    await queryRunner.dropTable('users', true);

    console.log('✅ Dropped all tables');
  }
}
