import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds observability columns to the `outbox` table so the publisher can
 * restore the originating request's trace + correlation context when it
 * picks the row up later. Without these columns the trace cleanly breaks
 * at the outbox boundary: the producing HTTP request is one trace, the
 * BullMQ-driven publish is a fresh trace, and Jaeger sees no link.
 *
 * - trace_id (32 chars) — W3C trace ID hex string
 * - parent_span_id (16 chars) — span ID of the saving span; becomes the
 *   parent of the outbox.publish span the publisher creates
 * - correlation_id — request-level handle, mirrored into log entries via
 *   AsyncLocalStorage
 * - user_id — useful for filtering Loki / outbox table by who triggered
 *   the event
 *
 * All columns are nullable: existing pending rows produced before this
 * migration must keep working. Indexes follow the pattern used elsewhere
 * (per-column secondary index) so debugging "show me everything for
 * userX in the last hour" stays a B-tree lookup.
 */
export class AddOutboxObservability1745625600000 implements MigrationInterface {
  name = 'AddOutboxObservability1745625600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "outbox" ADD COLUMN "trace_id" varchar(32) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "outbox" ADD COLUMN "parent_span_id" varchar(16) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "outbox" ADD COLUMN "correlation_id" varchar NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "outbox" ADD COLUMN "user_id" varchar NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_trace_id" ON "outbox" ("trace_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_correlation_id" ON "outbox" ("correlation_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_user_id" ON "outbox" ("user_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_outbox_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_outbox_correlation_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_outbox_trace_id"`);
    await queryRunner.query(`ALTER TABLE "outbox" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "outbox" DROP COLUMN "correlation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "outbox" DROP COLUMN "parent_span_id"`,
    );
    await queryRunner.query(`ALTER TABLE "outbox" DROP COLUMN "trace_id"`);
  }
}
