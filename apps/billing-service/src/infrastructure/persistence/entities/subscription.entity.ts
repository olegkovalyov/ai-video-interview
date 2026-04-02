import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  Index,
} from "typeorm";

@Entity("subscriptions")
@Index("idx_subscriptions_company_id", ["companyId"], { unique: true })
@Index("idx_subscriptions_stripe_customer_id", ["stripeCustomerId"])
export class SubscriptionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "company_id", type: "uuid" })
  companyId: string;

  @Column({ name: "plan_type", type: "varchar", length: 20, default: "free" })
  planType: string;

  @Column({ type: "varchar", length: 20, default: "active" })
  status: string;

  @Column({
    name: "stripe_customer_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripeCustomerId: string | null;

  @Column({
    name: "stripe_subscription_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripeSubscriptionId: string | null;

  @Column({ name: "current_period_start", type: "timestamptz" })
  currentPeriodStart: Date;

  @Column({ name: "current_period_end", type: "timestamptz" })
  currentPeriodEnd: Date;

  @Column({ name: "cancel_at_period_end", type: "boolean", default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: "canceled_at", type: "timestamptz", nullable: true })
  canceledAt: Date | null;

  @Column({ name: "trial_end", type: "timestamptz", nullable: true })
  trialEnd: Date | null;

  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
