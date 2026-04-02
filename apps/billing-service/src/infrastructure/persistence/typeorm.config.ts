import { DataSource } from "typeorm";
import { OutboxEntity } from "./entities/outbox.entity";
import { SubscriptionEntity } from "./entities/subscription.entity";
import { UsageRecordEntity } from "./entities/usage-record.entity";
import { PaymentEventEntity } from "./entities/payment-event.entity";

export default new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432", 10),
  username: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "postgres",
  database: process.env.DATABASE_NAME || "ai_video_interview_billing",
  entities: [
    OutboxEntity,
    SubscriptionEntity,
    UsageRecordEntity,
    PaymentEventEntity,
  ],
  migrations: ["src/infrastructure/persistence/migrations/*.ts"],
  synchronize: false,
  logging: false,
});
