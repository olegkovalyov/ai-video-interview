export class ProcessWebhookDeliveryCommand {
  constructor(
    public readonly webhookEndpointId: string,
    public readonly eventType: string,
    public readonly payload: Record<string, unknown>,
  ) {}
}
