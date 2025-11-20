export class ActivateSkillCommand {
  constructor(
    public readonly skillId: string,
    public readonly adminId: string,
  ) {}
}
