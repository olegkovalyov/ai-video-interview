import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserStatsQuery } from './get-user-stats.query';
import type { IUserReadRepository } from '../../../domain/repositories/user-read.repository.interface';

/**
 * User Stats Result
 */
export interface UserStatsResult {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  deletedUsers: number;
  usersByStatus: Record<string, number>;
}

/**
 * Get User Stats Query Handler
 */
@QueryHandler(GetUserStatsQuery)
export class GetUserStatsHandler implements IQueryHandler<GetUserStatsQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUserStatsQuery): Promise<UserStatsResult> {
    const [total, byStatus] = await Promise.all([
      this.userReadRepository.count(),
      this.userReadRepository.countByStatus(),
    ]);

    return {
      totalUsers: total,
      activeUsers: byStatus['active'] || 0,
      suspendedUsers: byStatus['suspended'] || 0,
      deletedUsers: byStatus['deleted'] || 0,
      usersByStatus: byStatus,
    };
  }
}
