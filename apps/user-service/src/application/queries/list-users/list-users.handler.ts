import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListUsersQuery } from './list-users.query';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserReadRepository, PaginatedResult } from '../../../domain/repositories/user-read.repository.interface';

/**
 * List Users Query Handler
 */
@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: ListUsersQuery): Promise<PaginatedResult<User>> {
    return this.userReadRepository.list(
      query.page,
      query.limit,
      query.filters,
    );
  }
}
