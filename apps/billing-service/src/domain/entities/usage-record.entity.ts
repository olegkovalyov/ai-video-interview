import { Entity } from "../base/base.entity";

interface UsageRecordProps {
  subscriptionId: string;
  period: string; // 'YYYY-MM' format
  interviewsUsed: number;
  analysisTokensUsed: number;
  storageUsedMb: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UsageRecord Entity
 * Tracks resource usage per subscription per billing period.
 * UNIQUE(subscriptionId, period)
 */
export class UsageRecord extends Entity<UsageRecordProps> {
  private constructor(id: string, props: UsageRecordProps) {
    super(id, props);
  }

  public static create(
    id: string,
    subscriptionId: string,
    period: string,
  ): UsageRecord {
    const now = new Date();
    return new UsageRecord(id, {
      subscriptionId,
      period,
      interviewsUsed: 0,
      analysisTokensUsed: 0,
      storageUsedMb: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: UsageRecordProps): UsageRecord {
    return new UsageRecord(id, props);
  }

  // ---- Getters ----

  public get subscriptionId(): string {
    return this.props.subscriptionId;
  }

  public get period(): string {
    return this.props.period;
  }

  public get interviewsUsed(): number {
    return this.props.interviewsUsed;
  }

  public get analysisTokensUsed(): number {
    return this.props.analysisTokensUsed;
  }

  public get storageUsedMb(): number {
    return this.props.storageUsedMb;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ---- Business Methods ----

  public incrementInterviews(count: number = 1): void {
    this.props.interviewsUsed += count;
    this.props.updatedAt = new Date();
  }

  public incrementAnalysisTokens(tokens: number): void {
    this.props.analysisTokensUsed += tokens;
    this.props.updatedAt = new Date();
  }

  public incrementStorage(mb: number): void {
    this.props.storageUsedMb += mb;
    this.props.updatedAt = new Date();
  }
}
