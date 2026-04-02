import { ValueObject } from "../base/base.value-object";

export const NOTIFICATION_TEMPLATES = [
  "welcome",
  "invitation",
  "invitation_reminder",
  "interview_started",
  "interview_completed",
  "analysis_ready",
  "analysis_failed",
  "payment_confirmed",
  "payment_failed",
  "quota_exceeded",
  "weekly_digest",
] as const;
export type NotificationTemplateType = (typeof NOTIFICATION_TEMPLATES)[number];

interface NotificationTemplateProps {
  value: NotificationTemplateType;
}

export class NotificationTemplate extends ValueObject<NotificationTemplateProps> {
  private constructor(props: NotificationTemplateProps) {
    super(props);
  }

  public static create(value: string): NotificationTemplate {
    if (!NOTIFICATION_TEMPLATES.includes(value as NotificationTemplateType)) {
      throw new Error(
        `Invalid notification template: ${value}. Must be one of: ${NOTIFICATION_TEMPLATES.join(", ")}`,
      );
    }
    return new NotificationTemplate({
      value: value as NotificationTemplateType,
    });
  }

  public get value(): NotificationTemplateType {
    return this.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}
