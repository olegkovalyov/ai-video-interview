import { AggregateRoot } from "../base/base.aggregate-root";
import { Channel, type ChannelType } from "../value-objects/channel.vo";
import {
  NotificationStatus,
  type NotificationStatusType,
} from "../value-objects/notification-status.vo";
import {
  NotificationTemplate,
  type NotificationTemplateType,
} from "../value-objects/notification-template.vo";
import { NotificationSentEvent } from "../events/notification-sent.event";
import { NotificationFailedEvent } from "../events/notification-failed.event";

interface NotificationProps {
  recipientId: string;
  recipientEmail: string;
  channel: Channel;
  template: NotificationTemplate;
  status: NotificationStatus;
  data: Record<string, unknown>;
  sentAt: Date | null;
  error: string | null;
  retryCount: number;
  createdAt: Date;
}

export class Notification extends AggregateRoot {
  private _id: string;
  private props: NotificationProps;

  private constructor(id: string, props: NotificationProps) {
    super();
    this._id = id;
    this.props = props;
  }

  // ─── Factory Methods ────────────────────────────────────

  public static create(params: {
    id: string;
    recipientId: string;
    recipientEmail: string;
    channel: ChannelType;
    template: NotificationTemplateType;
    data: Record<string, unknown>;
  }): Notification {
    const notification = new Notification(params.id, {
      recipientId: params.recipientId,
      recipientEmail: params.recipientEmail,
      channel: Channel.create(params.channel),
      template: NotificationTemplate.create(params.template),
      status: NotificationStatus.pending(),
      data: params.data,
      sentAt: null,
      error: null,
      retryCount: 0,
      createdAt: new Date(),
    });

    return notification;
  }

  public static reconstitute(params: {
    id: string;
    recipientId: string;
    recipientEmail: string;
    channel: ChannelType;
    template: NotificationTemplateType;
    status: NotificationStatusType;
    data: Record<string, unknown>;
    sentAt: Date | null;
    error: string | null;
    retryCount: number;
    createdAt: Date;
  }): Notification {
    return new Notification(params.id, {
      recipientId: params.recipientId,
      recipientEmail: params.recipientEmail,
      channel: Channel.create(params.channel),
      template: NotificationTemplate.create(params.template),
      status: NotificationStatus.create(params.status),
      data: params.data,
      sentAt: params.sentAt,
      error: params.error,
      retryCount: params.retryCount,
      createdAt: params.createdAt,
    });
  }

  // ─── Getters ────────────────────────────────────────────

  public get id(): string {
    return this._id;
  }

  public get recipientId(): string {
    return this.props.recipientId;
  }

  public get recipientEmail(): string {
    return this.props.recipientEmail;
  }

  public get channel(): ChannelType {
    return this.props.channel.value;
  }

  public get template(): NotificationTemplateType {
    return this.props.template.value;
  }

  public get status(): NotificationStatusType {
    return this.props.status.value;
  }

  public get data(): Record<string, unknown> {
    return this.props.data;
  }

  public get sentAt(): Date | null {
    return this.props.sentAt;
  }

  public get error(): string | null {
    return this.props.error;
  }

  public get retryCount(): number {
    return this.props.retryCount;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  // ─── Domain Methods ─────────────────────────────────────

  public markQueued(): void {
    if (!this.props.status.isPending() && !this.props.status.isFailed()) {
      throw new Error(
        `Cannot queue notification in status: ${this.props.status.value}`,
      );
    }
    this.props.status = NotificationStatus.queued();
  }

  public markSent(): void {
    if (!this.props.status.isQueued() && !this.props.status.isPending()) {
      throw new Error(
        `Cannot mark as sent from status: ${this.props.status.value}`,
      );
    }
    this.props.status = NotificationStatus.sent();
    this.props.sentAt = new Date();
    this.props.error = null;

    this.apply(
      new NotificationSentEvent(this._id, this.props.recipientId, new Date()),
    );
  }

  public markFailed(error: string): void {
    this.props.status = NotificationStatus.failed();
    this.props.error = error;
    this.props.retryCount += 1;

    this.apply(
      new NotificationFailedEvent(
        this._id,
        this.props.recipientId,
        error,
        new Date(),
      ),
    );
  }

  public markBounced(): void {
    this.props.status = NotificationStatus.bounced();
    this.props.error = "Email bounced";

    this.apply(
      new NotificationFailedEvent(
        this._id,
        this.props.recipientId,
        "Email bounced",
        new Date(),
      ),
    );
  }
}
