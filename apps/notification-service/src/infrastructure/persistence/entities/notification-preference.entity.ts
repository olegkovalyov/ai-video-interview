import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

@Entity("notification_preferences")
export class NotificationPreferenceEntity {
  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "email_enabled", type: "boolean", default: true })
  emailEnabled: boolean;

  @Column({ name: "in_app_enabled", type: "boolean", default: true })
  inAppEnabled: boolean;

  @Column({ type: "jsonb", default: "{}" })
  subscriptions: Record<string, boolean>;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
