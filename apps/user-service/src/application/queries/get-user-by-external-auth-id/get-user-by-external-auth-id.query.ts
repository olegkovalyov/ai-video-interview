import { Query } from '@nestjs/cqrs';
import type { UserReadModel } from '../../../domain/read-models/user.read-model';

export class GetUserByExternalAuthIdQuery extends Query<UserReadModel> {
  constructor(public readonly externalAuthId: string) {
    super();
  }
}
