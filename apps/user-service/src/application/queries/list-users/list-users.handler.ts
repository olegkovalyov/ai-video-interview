import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListUsersQuery } from './list-users.query';
import type { IUserReadRepository, PaginatedResult } from '../../../domain/repositories/user-read.repository.interface';
import type { UserReadModel } from '../../../domain/read-models/user.read-model';

/**
 * List Users Query Handler
 * Returns Read Models (plain objects) - no domain entities
 */
@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: ListUsersQuery): Promise<PaginatedResult<UserReadModel>> {
    return this.userReadRepository.list(
      query.page,
      query.limit,
      query.filters,
    );
  }
}
