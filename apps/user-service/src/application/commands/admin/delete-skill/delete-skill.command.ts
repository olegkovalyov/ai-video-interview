export class DeleteSkillCommand {
  constructor(
    public readonly skillId: string,
    public readonly adminId: string,
  ) {}
}
