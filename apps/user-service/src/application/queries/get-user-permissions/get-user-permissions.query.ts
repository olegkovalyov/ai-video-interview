import { Query } from '@nestjs/cqrs';
import type { UserPermissionsResult } from './get-user-permissions.handler';

export class GetUserPermissionsQuery extends Query<UserPermissionsResult> {
  constructor(public readonly userId: string) {
    super();
  }
}
