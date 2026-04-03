export class CreateCheckoutSessionCommand {
  constructor(
    public readonly companyId: string,
    public readonly planType: string,
    public readonly successUrl: string,
    public readonly cancelUrl: string,
  ) {}
}
