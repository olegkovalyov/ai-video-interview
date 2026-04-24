import { Query } from '@nestjs/cqrs';
import type { UserStatsResult } from './get-user-stats.handler';

export class GetUserStatsQuery extends Query<UserStatsResult> {}
