import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("usage_records")
@Index("idx_usage_records_period", ["subscriptionId", "period"], {
  unique: true,
})
export class UsageRecordEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "subscription_id", type: "uuid" })
  subscriptionId: string;

  @Column({ type: "varchar", length: 7 })
  period: string;

  @Column({ name: "interviews_used", type: "int", default: 0 })
  interviewsUsed: number;

  @Column({ name: "analysis_tokens_used", type: "int", default: 0 })
  analysisTokensUsed: number;

  @Column({
    name: "storage_used_mb",
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  storageUsedMb: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
