import { Query } from '@nestjs/cqrs';
import type { UserReadModel } from '../../../domain/read-models/user.read-model';

export class GetUserQuery extends Query<UserReadModel> {
  constructor(public readonly userId: string) {
    super();
  }
}
