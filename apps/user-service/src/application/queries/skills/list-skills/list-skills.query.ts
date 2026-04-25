import { Query } from '@nestjs/cqrs';
import type { PaginatedResult } from '../../../../domain/repositories/skill-read.repository.interface';
import type { SkillWithCategoryReadModel } from '../../../../domain/read-models/skill.read-model';

export interface ListSkillsQueryProps {
  page?: number;
  limit?: number;
  categoryId?: string;
  isActive?: boolean;
  search?: string;
}

export class ListSkillsQuery extends Query<
  PaginatedResult<SkillWithCategoryReadModel>
> {
  public readonly page: number;
  public readonly limit: number;
  public readonly categoryId?: string;
  public readonly isActive?: boolean;
  public readonly search?: string;

  constructor(props: ListSkillsQueryProps = {}) {
    super();
    this.page = props.page ?? 1;
    this.limit = props.limit ?? 50;
    this.categoryId = props.categoryId;
    this.isActive = props.isActive;
    this.search = props.search;
  }
}
