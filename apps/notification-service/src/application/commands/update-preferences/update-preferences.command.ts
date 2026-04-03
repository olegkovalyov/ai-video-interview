export class UpdatePreferencesCommand {
  constructor(
    public readonly userId: string,
    public readonly emailEnabled?: boolean,
    public readonly inAppEnabled?: boolean,
    public readonly subscriptions?: Record<string, boolean>,
  ) {}
}
