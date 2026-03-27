import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOutboxTable1743000000000 implements MigrationInterface {
  name = "CreateOutboxTable1743000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "outbox" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_id" character varying NOT NULL,
        "event_type" character varying NOT NULL,
        "aggregate_id" character varying NOT NULL,
        "payload" jsonb NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "retry_count" integer NOT NULL DEFAULT 0,
        "error_message" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "published_at" TIMESTAMP,
        CONSTRAINT "PK_outbox_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_outbox_event_id" UNIQUE ("event_id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_outbox_status" ON "outbox" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_created_at" ON "outbox" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_status_created" ON "outbox" ("status", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_event_type" ON "outbox" ("event_type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_outbox_event_type"`);
    await queryRunner.query(`DROP INDEX "idx_outbox_status_created"`);
    await queryRunner.query(`DROP INDEX "idx_outbox_created_at"`);
    await queryRunner.query(`DROP INDEX "idx_outbox_status"`);
    await queryRunner.query(`DROP TABLE "outbox"`);
  }
}
