export class RegisterWebhookCommand {
  constructor(
    public readonly companyId: string,
    public readonly url: string,
    public readonly events: string[],
  ) {}
}
