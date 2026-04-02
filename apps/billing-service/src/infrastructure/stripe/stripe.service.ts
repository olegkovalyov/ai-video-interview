import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import type { IStripeService } from "../../application/interfaces/stripe-service.interface";
import { LoggerService } from "../logger/logger.service";
import { PLANS } from "../../config/plans.config";

@Injectable()
export class StripeService implements IStripeService {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly pricePlus: string;
  private readonly pricePro: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.stripe = new Stripe(
      this.configService.get("STRIPE_SECRET_KEY", "sk_test_placeholder"),
      { apiVersion: "2024-12-18.acacia" as any },
    );
    this.webhookSecret = this.configService.get(
      "STRIPE_WEBHOOK_SECRET",
      "whsec_placeholder",
    );
    this.pricePlus = this.configService.get(
      "STRIPE_PRICE_PLUS",
      "price_plus_placeholder",
    );
    this.pricePro = this.configService.get(
      "STRIPE_PRICE_PRO",
      "price_pro_placeholder",
    );
    this.frontendUrl = this.configService.get(
      "FRONTEND_URL",
      "http://localhost:3000",
    );
  }

  async createCheckoutSession(params: {
    companyId: string;
    planType: string;
    stripeCustomerId?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; checkoutUrl: string }> {
    const priceId = params.planType === "pro" ? this.pricePro : this.pricePlus;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:
        params.successUrl || `${this.frontendUrl}/billing?success=true`,
      cancel_url:
        params.cancelUrl || `${this.frontendUrl}/billing?canceled=true`,
      metadata: {
        companyId: params.companyId,
        planType: params.planType,
      },
      client_reference_id: params.companyId,
    };

    if (params.stripeCustomerId) {
      sessionParams.customer = params.stripeCustomerId;
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    this.logger.info(`Stripe checkout session created: ${session.id}`, {
      action: "stripe.checkout.created",
      companyId: params.companyId,
      planType: params.planType,
    } as any);

    return {
      sessionId: session.id,
      checkoutUrl: session.url!,
    };
  }

  async createPortalSession(params: {
    stripeCustomerId: string;
    returnUrl: string;
  }): Promise<{ portalUrl: string }> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: params.stripeCustomerId,
      return_url: params.returnUrl || `${this.frontendUrl}/billing`,
    });

    return { portalUrl: session.url };
  }

  async constructWebhookEvent(
    rawBody: string | Buffer,
    signature: string,
  ): Promise<{
    id: string;
    type: string;
    data: Record<string, unknown>;
  }> {
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );

    return {
      id: event.id,
      type: event.type,
      data: event.data.object as unknown as Record<string, unknown>,
    };
  }

  async listInvoices(
    stripeCustomerId: string,
    limit: number = 10,
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
  > {
    const invoices = await this.stripe.invoices.list({
      customer: stripeCustomerId,
      limit,
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
      pdfUrl: invoice.invoice_pdf || null,
      createdAt: invoice.created,
    }));
  }
}
