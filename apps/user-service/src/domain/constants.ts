/**
 * Domain-level constants for User Service
 * Event types used in Outbox integration events (Kafka)
 */

export const USER_EVENT_TYPES = {
  CREATED: 'user.created',
  UPDATED: 'user.updated',
  DELETED: 'user.deleted',
  SUSPENDED: 'user.suspended',
  ACTIVATED: 'user.activated',
  ROLE_SELECTED: 'user.role-selected',
} as const;

export const COMPANY_EVENT_TYPES = {
  CREATED: 'company.created',
  UPDATED: 'company.updated',
  DELETED: 'company.deleted',
} as const;

export type UserEventType = (typeof USER_EVENT_TYPES)[keyof typeof USER_EVENT_TYPES];
export type CompanyEventType = (typeof COMPANY_EVENT_TYPES)[keyof typeof COMPANY_EVENT_TYPES];
export type IntegrationEventType = UserEventType | CompanyEventType;
