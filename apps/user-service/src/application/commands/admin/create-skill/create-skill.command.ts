/**
 * Command: Create Skill
 * Admin creates a new skill in the system
 */
export class CreateSkillCommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly categoryId: string | null,
    public readonly description: string | null,
    public readonly adminId: string, // для логирования
  ) {}
}
