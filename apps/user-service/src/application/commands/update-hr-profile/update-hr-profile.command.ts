/**
 * UpdateHRProfile Command
 * Updates HR user's profile information
 */
export class UpdateHRProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly companyName?: string,
    public readonly position?: string,
  ) {}
}
