import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1750000000000 implements MigrationInterface {
  name = "InitialSchema1750000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Notifications table
    await queryRunner.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY,
        recipient_id UUID NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        template VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        data JSONB NOT NULL DEFAULT '{}',
        sent_at TIMESTAMPTZ,
        error TEXT,
        retry_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_notifications_recipient ON notifications(recipient_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_notifications_status ON notifications(status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_notifications_recipient_status ON notifications(recipient_id, status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_notifications_created_at ON notifications(created_at)`,
    );

    // Notification preferences table
    await queryRunner.query(`
      CREATE TABLE notification_preferences (
        user_id UUID PRIMARY KEY,
        email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        subscriptions JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Webhook endpoints table
    await queryRunner.query(`
      CREATE TABLE webhook_endpoints (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL,
        url VARCHAR(500) NOT NULL,
        secret VARCHAR(255) NOT NULL,
        events TEXT[] NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        failure_count INT NOT NULL DEFAULT 0,
        last_delivery_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_webhook_company ON webhook_endpoints(company_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_webhook_status ON webhook_endpoints(status)`,
    );

    // Outbox table
    await queryRunner.query(`
      CREATE TABLE outbox (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(255) NOT NULL UNIQUE,
        event_type VARCHAR(255) NOT NULL,
        aggregate_id VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        retry_count INT NOT NULL DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        published_at TIMESTAMPTZ
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_outbox_status ON outbox(status)`);
    await queryRunner.query(
      `CREATE INDEX idx_outbox_created_at ON outbox(created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_outbox_status_created ON outbox(status, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_outbox_event_type ON outbox(event_type)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS outbox`);
    await queryRunner.query(`DROP TABLE IF EXISTS webhook_endpoints`);
    await queryRunner.query(`DROP TABLE IF EXISTS notification_preferences`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
  }
}
