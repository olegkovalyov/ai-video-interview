import { Command } from '@nestjs/cqrs';

export interface UpdateSkillCommandProps {
  skillId: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  adminId: string;
}

export class UpdateSkillCommand extends Command<void> {
  public readonly skillId: string;
  public readonly name: string;
  public readonly description: string | null;
  public readonly categoryId: string | null;
  public readonly adminId: string;

  constructor(props: UpdateSkillCommandProps) {
    super();
    this.skillId = props.skillId;
    this.name = props.name;
    this.description = props.description;
    this.categoryId = props.categoryId;
    this.adminId = props.adminId;
  }
}
