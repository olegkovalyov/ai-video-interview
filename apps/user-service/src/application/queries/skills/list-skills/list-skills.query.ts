import { Query } from '@nestjs/cqrs';
import type { PaginatedResult } from '../../../../domain/repositories/skill-read.repository.interface';
import type { SkillWithCategoryReadModel } from '../../../../domain/read-models/skill.read-model';

export class ListSkillsQuery extends Query<
  PaginatedResult<SkillWithCategoryReadModel>
> {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 50,
    public readonly categoryId?: string,
    public readonly isActive?: boolean,
    public readonly search?: string,
  ) {
    super();
  }
}
