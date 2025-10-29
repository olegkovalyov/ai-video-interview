import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateRolesTable1000000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'permissions',
            type: 'jsonb',
            default: "'[]'",
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

    // Insert default roles
    await queryRunner.query(`
      INSERT INTO roles (id, name, display_name, description, permissions) VALUES
      (uuid_generate_v4(), 'Admin', 'Administrator', 'Full system access', '["*"]'),
      (uuid_generate_v4(), 'HR', 'HR Manager', 'Manage interviews and candidates', '["users:read","interviews:*","candidates:*","analytics:view"]'),
      (uuid_generate_v4(), 'Candidate', 'Candidate', 'Take interviews', '["users:read_own","users:write_own","interviews:take"]'),
      (uuid_generate_v4(), 'Viewer', 'Viewer', 'Read-only access', '["users:read","interviews:read","analytics:view"]')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('roles');
  }
}
