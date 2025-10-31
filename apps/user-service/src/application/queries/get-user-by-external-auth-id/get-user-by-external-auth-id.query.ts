/**
 * Get User By External Auth ID Query
 * Query to retrieve user by external auth provider ID (for API Gateway integration)
 */
export class GetUserByExternalAuthIdQuery {
  constructor(public readonly externalAuthId: string) {}
}
