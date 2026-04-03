import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListInvoicesQuery } from "./list-invoices.query";
import type { ISubscriptionRepository } from "../../../domain/repositories/subscription.repository.interface";
import type { IStripeService } from "../../interfaces/stripe-service.interface";
import { QuotaCacheService } from "../../../infrastructure/cache/quota-cache.service";
import { SubscriptionNotFoundException } from "../../../domain/exceptions/billing.exceptions";

@QueryHandler(ListInvoicesQuery)
export class ListInvoicesHandler implements IQueryHandler<ListInvoicesQuery> {
  constructor(
    @Inject("ISubscriptionRepository")
    private readonly subscriptionRepo: ISubscriptionRepository,
    @Inject("IStripeService")
    private readonly stripeService: IStripeService,
    private readonly cache: QuotaCacheService,
  ) {}

  async execute(query: ListInvoicesQuery) {
    const subscription = await this.subscriptionRepo.findByCompanyId(
      query.companyId,
    );
    if (!subscription) {
      throw new SubscriptionNotFoundException(query.companyId);
    }

    if (!subscription.stripeCustomerId) {
      return []; // Free plan, no invoices
    }

    // Check cache first (5min TTL)
    const cached = await this.cache.getInvoices(subscription.stripeCustomerId);
    if (cached) {
      return cached;
    }

    const invoices = await this.stripeService.listInvoices(
      subscription.stripeCustomerId,
      query.limit || 10,
    );

    await this.cache.setInvoices(subscription.stripeCustomerId, invoices);

    return invoices;
  }
}
