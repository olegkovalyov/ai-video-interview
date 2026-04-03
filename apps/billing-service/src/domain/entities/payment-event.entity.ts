import { Entity } from "../base/base.entity";

interface PaymentEventProps {
  subscriptionId: string | null;
  stripeEventId: string;
  eventType: string;
  data: Record<string, unknown>;
  processedAt: Date;
}

/**
 * PaymentEvent Entity
 * Records Stripe webhook events for idempotency and audit.
 * UNIQUE constraint on stripeEventId prevents double processing.
 */
export class PaymentEvent extends Entity<PaymentEventProps> {
  private constructor(id: string, props: PaymentEventProps) {
    super(id, props);
  }

  public static create(
    id: string,
    stripeEventId: string,
    eventType: string,
    data: Record<string, unknown>,
    subscriptionId: string | null = null,
  ): PaymentEvent {
    return new PaymentEvent(id, {
      subscriptionId,
      stripeEventId,
      eventType,
      data,
      processedAt: new Date(),
    });
  }

  public static reconstitute(
    id: string,
    props: PaymentEventProps,
  ): PaymentEvent {
    return new PaymentEvent(id, props);
  }

  // ---- Getters ----

  public get subscriptionId(): string | null {
    return this.props.subscriptionId;
  }

  public get stripeEventId(): string {
    return this.props.stripeEventId;
  }

  public get eventType(): string {
    return this.props.eventType;
  }

  public get data(): Record<string, unknown> {
    return this.props.data;
  }

  public get processedAt(): Date {
    return this.props.processedAt;
  }
}
