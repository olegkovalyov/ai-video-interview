/**
 * Get User Permissions Query
 * Query to retrieve user's roles and permissions
 */
export class GetUserPermissionsQuery {
  constructor(public readonly userId: string) {}
}
