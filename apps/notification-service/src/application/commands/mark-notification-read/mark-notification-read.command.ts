export class MarkNotificationReadCommand {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
  ) {}
}
