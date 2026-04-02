export class ProcessStripeWebhookCommand {
  constructor(
    public readonly rawBody: string | Buffer,
    public readonly signature: string,
  ) {}
}
