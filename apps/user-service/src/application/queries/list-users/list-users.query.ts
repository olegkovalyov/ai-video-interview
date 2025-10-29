import { UserListFilters } from '../../../domain/repositories/user-read.repository.interface';

/**
 * List Users Query
 * Query to retrieve paginated list of users
 */
export class ListUsersQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: UserListFilters,
  ) {}
}
