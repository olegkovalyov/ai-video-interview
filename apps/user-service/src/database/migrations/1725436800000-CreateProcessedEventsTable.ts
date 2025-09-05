import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateProcessedEventsTable1725436800000 implements MigrationInterface {
  name = 'CreateProcessedEventsTable1725436800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'processed_events',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'event_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'service_name',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'processed_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'payload_hash',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
        ],
        uniques: [
          {
            name: 'unique_event_per_service',
            columnNames: ['event_id', 'service_name'],
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex('processed_events', new TableIndex({
      name: 'idx_processed_events_event_id',
      columnNames: ['event_id']
    }));
    
    await queryRunner.createIndex('processed_events', new TableIndex({
      name: 'idx_processed_events_service_name', 
      columnNames: ['service_name']
    }));
    
    await queryRunner.createIndex('processed_events', new TableIndex({
      name: 'idx_processed_events_processed_at',
      columnNames: ['processed_at']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('processed_events');
  }
}
