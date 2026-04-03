import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity("payment_events")
@Index("idx_payment_events_stripe_event_id", ["stripeEventId"], {
  unique: true,
})
export class PaymentEventEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "subscription_id", type: "uuid", nullable: true })
  subscriptionId: string | null;

  @Column({ name: "stripe_event_id", type: "varchar", length: 255 })
  stripeEventId: string;

  @Column({ name: "event_type", type: "varchar", length: 100 })
  eventType: string;

  @Column({ type: "jsonb", default: "{}" })
  data: Record<string, unknown>;

  @Column({ name: "processed_at", type: "timestamptz", default: () => "NOW()" })
  processedAt: Date;
}
