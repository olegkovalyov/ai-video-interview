/**
 * DTO for creating user in User Service via HTTP
 * Used by Saga orchestration
 */
export interface CreateUserInternalDto {
  userId: string;
  externalAuthId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface CreateUserInternalResponse {
  success: boolean;
  data?: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    createdAt: Date;
  };
  error?: string;
  code?: string;
  details?: string;
}
