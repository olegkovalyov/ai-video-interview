import { Query } from '@nestjs/cqrs';
import type { SkillWithCategoryReadModel } from '../../../../domain/read-models/skill.read-model';

export class GetSkillQuery extends Query<SkillWithCategoryReadModel> {
  constructor(public readonly skillId: string) {
    super();
  }
}
