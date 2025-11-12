export class UpdateSkillCommand {
  constructor(
    public readonly skillId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly categoryId: string | null,
    public readonly adminId: string,
  ) {}
}
