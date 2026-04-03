import { AggregateRoot } from "../base/base.aggregate-root";

export const WEBHOOK_STATUSES = ["active", "disabled"] as const;
export type WebhookStatusType = (typeof WEBHOOK_STATUSES)[number];

const MAX_FAILURE_COUNT = 10;

interface WebhookEndpointProps {
  companyId: string;
  url: string;
  secret: string;
  events: string[];
  status: WebhookStatusType;
  failureCount: number;
  lastDeliveryAt: Date | null;
  createdAt: Date;
}

export class WebhookEndpoint extends AggregateRoot {
  private _id: string;
  private props: WebhookEndpointProps;

  private constructor(id: string, props: WebhookEndpointProps) {
    super();
    this._id = id;
    this.props = props;
  }

  // ─── Factory Methods ────────────────────────────────────

  public static create(params: {
    id: string;
    companyId: string;
    url: string;
    secret: string;
    events: string[];
  }): WebhookEndpoint {
    return new WebhookEndpoint(params.id, {
      companyId: params.companyId,
      url: params.url,
      secret: params.secret,
      events: params.events,
      status: "active",
      failureCount: 0,
      lastDeliveryAt: null,
      createdAt: new Date(),
    });
  }

  public static reconstitute(params: {
    id: string;
    companyId: string;
    url: string;
    secret: string;
    events: string[];
    status: WebhookStatusType;
    failureCount: number;
    lastDeliveryAt: Date | null;
    createdAt: Date;
  }): WebhookEndpoint {
    return new WebhookEndpoint(params.id, {
      companyId: params.companyId,
      url: params.url,
      secret: params.secret,
      events: params.events,
      status: params.status,
      failureCount: params.failureCount,
      lastDeliveryAt: params.lastDeliveryAt,
      createdAt: params.createdAt,
    });
  }

  // ─── Getters ────────────────────────────────────────────

  public get id(): string {
    return this._id;
  }

  public get companyId(): string {
    return this.props.companyId;
  }

  public get url(): string {
    return this.props.url;
  }

  public get secret(): string {
    return this.props.secret;
  }

  public get events(): string[] {
    return [...this.props.events];
  }

  public get status(): WebhookStatusType {
    return this.props.status;
  }

  public get failureCount(): number {
    return this.props.failureCount;
  }

  public get lastDeliveryAt(): Date | null {
    return this.props.lastDeliveryAt;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  // ─── Domain Methods ─────────────────────────────────────

  public recordFailure(): void {
    this.props.failureCount += 1;
    if (this.props.failureCount >= MAX_FAILURE_COUNT) {
      this.props.status = "disabled";
    }
  }

  public recordSuccess(): void {
    this.props.failureCount = 0;
    this.props.lastDeliveryAt = new Date();
  }

  public disable(): void {
    this.props.status = "disabled";
  }

  public enable(): void {
    this.props.status = "active";
    this.props.failureCount = 0;
  }

  public isSubscribedTo(eventType: string): boolean {
    return this.props.events.includes(eventType);
  }

  public isActive(): boolean {
    return this.props.status === "active";
  }
}
