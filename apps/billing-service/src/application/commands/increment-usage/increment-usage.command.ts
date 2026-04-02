export class IncrementUsageCommand {
  constructor(
    public readonly companyId: string,
    public readonly resource: "interviews" | "analysisTokens" | "storage",
    public readonly amount: number = 1,
  ) {}
}
