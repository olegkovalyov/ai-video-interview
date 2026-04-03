/**
 * IStripeService — Application-layer port for Stripe operations.
 * Infrastructure provides the implementation using the stripe npm package.
 *
 * Inject via token: @Inject('IStripeService')
 */
export interface IStripeService {
  /**
   * Create a Stripe Checkout Session for plan upgrade
   */
  createCheckoutSession(params: {
    companyId: string;
    planType: string;
    stripeCustomerId?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; checkoutUrl: string }>;

  /**
   * Create a Stripe Customer Portal session for billing management
   */
  createPortalSession(params: {
    stripeCustomerId: string;
    returnUrl: string;
  }): Promise<{ portalUrl: string }>;

  /**
   * Construct and verify a Stripe webhook event from raw body + signature
   */
  constructWebhookEvent(
    rawBody: string | Buffer,
    signature: string,
  ): Promise<{
    id: string;
    type: string;
    data: Record<string, unknown>;
  }>;

  /**
   * List invoices for a customer
   */
  listInvoices(
    stripeCustomerId: string,
    limit?: number,
  ): Promise<
    Array<{
      id: string;
      number: string | null;
      status: string | null;
      amountDue: number;
      amountPaid: number;
      currency: string;
      periodStart: number;
      periodEnd: number;
      hostedInvoiceUrl: string | null;
      pdfUrl: string | null;
      createdAt: number;
    }>
  >;
}
