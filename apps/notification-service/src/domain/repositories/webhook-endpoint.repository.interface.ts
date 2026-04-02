import type { WebhookEndpoint } from "../aggregates/webhook-endpoint.aggregate";
import type { ITransactionContext } from "../../application/interfaces/transaction-context.interface";

export interface IWebhookEndpointRepository {
  save(endpoint: WebhookEndpoint, tx?: ITransactionContext): Promise<void>;
  findById(id: string): Promise<WebhookEndpoint | null>;
  findByCompanyId(companyId: string): Promise<WebhookEndpoint[]>;
  findActiveByEventType(eventType: string): Promise<WebhookEndpoint[]>;
  delete(id: string): Promise<void>;
}
