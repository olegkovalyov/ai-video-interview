/**
 * Get User By Keycloak ID Query
 * Query to retrieve user by Keycloak ID (for API Gateway integration)
 */
export class GetUserByKeycloakIdQuery {
  constructor(public readonly keycloakId: string) {}
}
