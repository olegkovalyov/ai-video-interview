export class ProcessStripeWebhookCommand {
  constructor(
    public readonly rawBody: Buffer,
    public readonly signature: string,
  ) {}
}
