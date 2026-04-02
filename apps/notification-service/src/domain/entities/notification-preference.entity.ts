import { Entity } from "../base/base.entity";

interface NotificationPreferenceProps {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  subscriptions: Record<string, boolean>;
  updatedAt: Date;
}

export class NotificationPreference extends Entity<NotificationPreferenceProps> {
  private constructor(userId: string, props: NotificationPreferenceProps) {
    super(userId, props);
  }

  // ─── Factory Methods ────────────────────────────────────

  public static create(userId: string): NotificationPreference {
    return new NotificationPreference(userId, {
      emailEnabled: true,
      inAppEnabled: true,
      subscriptions: {},
      updatedAt: new Date(),
    });
  }

  public static reconstitute(params: {
    userId: string;
    emailEnabled: boolean;
    inAppEnabled: boolean;
    subscriptions: Record<string, boolean>;
    updatedAt: Date;
  }): NotificationPreference {
    return new NotificationPreference(params.userId, {
      emailEnabled: params.emailEnabled,
      inAppEnabled: params.inAppEnabled,
      subscriptions: params.subscriptions,
      updatedAt: params.updatedAt,
    });
  }

  // ─── Getters ────────────────────────────────────────────

  public get userId(): string {
    return this._id;
  }

  public get emailEnabled(): boolean {
    return this.props.emailEnabled;
  }

  public get inAppEnabled(): boolean {
    return this.props.inAppEnabled;
  }

  public get subscriptions(): Record<string, boolean> {
    return { ...this.props.subscriptions };
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ─── Domain Methods ─────────────────────────────────────

  public isSubscribed(notificationType: string): boolean {
    // Default to true if subscription preference not explicitly set
    return this.props.subscriptions[notificationType] !== false;
  }

  public toggleEmail(): void {
    this.props.emailEnabled = !this.props.emailEnabled;
    this.props.updatedAt = new Date();
  }

  public toggleInApp(): void {
    this.props.inAppEnabled = !this.props.inAppEnabled;
    this.props.updatedAt = new Date();
  }

  public updateSubscription(notificationType: string, enabled: boolean): void {
    this.props.subscriptions[notificationType] = enabled;
    this.props.updatedAt = new Date();
  }

  public updatePreferences(params: {
    emailEnabled?: boolean;
    inAppEnabled?: boolean;
    subscriptions?: Record<string, boolean>;
  }): void {
    if (params.emailEnabled !== undefined) {
      this.props.emailEnabled = params.emailEnabled;
    }
    if (params.inAppEnabled !== undefined) {
      this.props.inAppEnabled = params.inAppEnabled;
    }
    if (params.subscriptions !== undefined) {
      this.props.subscriptions = {
        ...this.props.subscriptions,
        ...params.subscriptions,
      };
    }
    this.props.updatedAt = new Date();
  }
}
