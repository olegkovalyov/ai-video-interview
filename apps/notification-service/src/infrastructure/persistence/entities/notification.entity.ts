import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("notifications")
@Index("idx_notifications_recipient", ["recipientId"])
@Index("idx_notifications_status", ["status"])
@Index("idx_notifications_recipient_status", ["recipientId", "status"])
@Index("idx_notifications_created_at", ["createdAt"])
export class NotificationEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "recipient_id", type: "uuid" })
  recipientId: string;

  @Column({ name: "recipient_email", type: "varchar", length: 255 })
  recipientEmail: string;

  @Column({ type: "varchar", length: 20 })
  channel: string;

  @Column({ type: "varchar", length: 100 })
  template: string;

  @Column({ type: "varchar", length: 20, default: "pending" })
  status: string;

  @Column({ type: "jsonb", default: "{}" })
  data: Record<string, unknown>;

  @Column({ name: "sent_at", type: "timestamptz", nullable: true })
  sentAt: Date | null;

  @Column({ type: "text", nullable: true })
  error: string | null;

  @Column({ name: "retry_count", type: "int", default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
