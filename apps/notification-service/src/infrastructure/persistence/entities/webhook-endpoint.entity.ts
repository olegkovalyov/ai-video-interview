import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("webhook_endpoints")
@Index("idx_webhook_company", ["companyId"])
@Index("idx_webhook_status", ["status"])
export class WebhookEndpointEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "company_id", type: "uuid" })
  companyId: string;

  @Column({ type: "varchar", length: 500 })
  url: string;

  @Column({ type: "varchar", length: 255 })
  secret: string;

  @Column({ type: "text", array: true })
  events: string[];

  @Column({ type: "varchar", length: 20, default: "active" })
  status: string;

  @Column({ name: "failure_count", type: "int", default: 0 })
  failureCount: number;

  @Column({ name: "last_delivery_at", type: "timestamptz", nullable: true })
  lastDeliveryAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
