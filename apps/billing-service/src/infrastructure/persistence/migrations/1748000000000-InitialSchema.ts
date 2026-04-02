import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1748000000000 implements MigrationInterface {
  name = "InitialSchema1748000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL,
        plan_type VARCHAR(20) NOT NULL DEFAULT 'free',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
        canceled_at TIMESTAMPTZ,
        trial_end TIMESTAMPTZ,
        version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_subscriptions_company_id UNIQUE (company_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE usage_records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        subscription_id UUID NOT NULL REFERENCES subscriptions(id),
        period VARCHAR(7) NOT NULL,
        interviews_used INT NOT NULL DEFAULT 0,
        analysis_tokens_used INT NOT NULL DEFAULT 0,
        storage_used_mb DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_usage_records_sub_period UNIQUE (subscription_id, period)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE payment_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        subscription_id UUID REFERENCES subscriptions(id),
        stripe_event_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_payment_events_stripe_event_id UNIQUE (stripe_event_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE outbox (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_id VARCHAR NOT NULL UNIQUE,
        event_type VARCHAR NOT NULL,
        aggregate_id VARCHAR NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending',
        retry_count INT NOT NULL DEFAULT 0,
        error_message VARCHAR,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        published_at TIMESTAMPTZ
      )
    `);

    // Indexes
    await queryRunner.query(
      `CREATE INDEX idx_subscriptions_company_id ON subscriptions(company_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_usage_records_period ON usage_records(subscription_id, period)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_payment_events_stripe_event_id ON payment_events(stripe_event_id)`,
    );
    await queryRunner.query(`CREATE INDEX idx_outbox_status ON outbox(status)`);
    await queryRunner.query(
      `CREATE INDEX idx_outbox_status_created ON outbox(status, created_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS outbox`);
    await queryRunner.query(`DROP TABLE IF EXISTS payment_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS usage_records`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscriptions`);
  }
}
