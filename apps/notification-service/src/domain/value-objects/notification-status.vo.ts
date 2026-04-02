import { ValueObject } from "../base/base.value-object";

export const NOTIFICATION_STATUSES = [
  "pending",
  "queued",
  "sent",
  "failed",
  "bounced",
] as const;
export type NotificationStatusType = (typeof NOTIFICATION_STATUSES)[number];

interface NotificationStatusProps {
  value: NotificationStatusType;
}

export class NotificationStatus extends ValueObject<NotificationStatusProps> {
  private constructor(props: NotificationStatusProps) {
    super(props);
  }

  public static create(value: string): NotificationStatus {
    if (!NOTIFICATION_STATUSES.includes(value as NotificationStatusType)) {
      throw new Error(
        `Invalid notification status: ${value}. Must be one of: ${NOTIFICATION_STATUSES.join(", ")}`,
      );
    }
    return new NotificationStatus({ value: value as NotificationStatusType });
  }

  public static pending(): NotificationStatus {
    return new NotificationStatus({ value: "pending" });
  }

  public static queued(): NotificationStatus {
    return new NotificationStatus({ value: "queued" });
  }

  public static sent(): NotificationStatus {
    return new NotificationStatus({ value: "sent" });
  }

  public static failed(): NotificationStatus {
    return new NotificationStatus({ value: "failed" });
  }

  public static bounced(): NotificationStatus {
    return new NotificationStatus({ value: "bounced" });
  }

  public get value(): NotificationStatusType {
    return this.props.value;
  }

  public isPending(): boolean {
    return this.props.value === "pending";
  }

  public isQueued(): boolean {
    return this.props.value === "queued";
  }

  public isSent(): boolean {
    return this.props.value === "sent";
  }

  public isFailed(): boolean {
    return this.props.value === "failed";
  }

  public isBounced(): boolean {
    return this.props.value === "bounced";
  }

  public toString(): string {
    return this.props.value;
  }
}
