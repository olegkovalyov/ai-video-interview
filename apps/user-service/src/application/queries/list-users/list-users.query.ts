import { Query } from '@nestjs/cqrs';
import type {
  PaginatedResult,
  UserListFilters,
} from '../../../domain/repositories/user-read.repository.interface';
import type { UserReadModel } from '../../../domain/read-models/user.read-model';

export class ListUsersQuery extends Query<PaginatedResult<UserReadModel>> {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: UserListFilters,
  ) {
    super();
  }
}
