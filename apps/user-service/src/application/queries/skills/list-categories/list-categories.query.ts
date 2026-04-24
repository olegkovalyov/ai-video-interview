import { Query } from '@nestjs/cqrs';
import type { SkillCategoryReadModel } from '../../../../domain/read-models/skill.read-model';

export class ListSkillCategoriesQuery extends Query<SkillCategoryReadModel[]> {}
