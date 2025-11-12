export class DeactivateSkillCommand {
  constructor(
    public readonly skillId: string,
    public readonly adminId: string,
  ) {}
}
