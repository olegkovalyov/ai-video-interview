import { Command } from '@nestjs/cqrs';

export interface CreateSkillCommandProps {
  name: string;
  slug: string;
  categoryId: string | null;
  description: string | null;
  adminId: string;
}

export class CreateSkillCommand extends Command<{ skillId: string }> {
  public readonly name: string;
  public readonly slug: string;
  public readonly categoryId: string | null;
  public readonly description: string | null;
  public readonly adminId: string;

  constructor(props: CreateSkillCommandProps) {
    super();
    this.name = props.name;
    this.slug = props.slug;
    this.categoryId = props.categoryId;
    this.description = props.description;
    this.adminId = props.adminId;
  }
}
