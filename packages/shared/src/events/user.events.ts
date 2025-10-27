// User Domain Events for Kafka messaging

export interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: number; // Unix timestamp in milliseconds
  version: string;
  source: string;
}

export interface UserRegisteredEvent extends BaseEvent {
  eventType: 'user.registered';
  payload: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    registrationMethod: 'authentik' | 'oauth' | 'email';
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface UserAuthenticatedEvent extends BaseEvent {
  eventType: 'user.authenticated';
  payload: {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    authMethod: 'oauth2' | 'jwt_refresh';
    sessionId: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface UserProfileUpdatedEvent extends BaseEvent {
  eventType: 'user.profile_updated';
  payload: {
    userId: string;
    updatedFields: string[];
    previousValues?: Record<string, any>;
    newValues: Record<string, any>;
  };
}

export interface UserLoggedOutEvent extends BaseEvent {
  eventType: 'user.logged_out';
  payload: {
    userId: string;
    sessionId: string;
    logoutReason: 'user_action' | 'token_expired' | 'admin_action';
  };
}

export interface UserDeletedEvent extends BaseEvent {
  eventType: 'user.deleted';
  payload: {
    userId: string;
    deletedBy: 'admin' | 'user' | 'system';
  };
}

export interface UserRoleAssignedEvent extends BaseEvent {
  eventType: 'user.role_assigned';
  payload: {
    userId: string;
    roleName: string;
    assignedBy?: string;
  };
}

export interface UserRoleRemovedEvent extends BaseEvent {
  eventType: 'user.role_removed';
  payload: {
    userId: string;
    roleName: string;
    removedBy?: string;
  };
}

// Union type for all user events
export type UserEvent = 
  | UserRegisteredEvent 
  | UserAuthenticatedEvent 
  | UserProfileUpdatedEvent 
  | UserLoggedOutEvent
  | UserDeletedEvent
  | UserRoleAssignedEvent
  | UserRoleRemovedEvent;

// Kafka topics
export const USER_EVENTS_TOPIC = 'user.events';
export const USER_ANALYTICS_TOPIC = 'user.analytics';

// Event factory helpers
export class UserEventFactory {
  static createUserRegistered(
    userId: string,
    email: string,
    registrationData: Partial<UserRegisteredEvent['payload']>
  ): UserRegisteredEvent {
    return {
      eventId: crypto.randomUUID(),
      eventType: 'user.registered',
      timestamp: Date.now(),
      version: '1.0',
      source: 'api-gateway',
      payload: {
        userId,
        email,
        registrationMethod: 'authentik',
        ...registrationData,
      },
    };
  }

  static createUserAuthenticated(
    userId: string,
    email: string,
    sessionId: string,
    authData: Partial<UserAuthenticatedEvent['payload']> & { firstName?: string; lastName?: string }
  ): UserAuthenticatedEvent {
    return {
      eventId: crypto.randomUUID(),
      eventType: 'user.authenticated',
      timestamp: Date.now(),
      version: '1.0',
      source: 'api-gateway',
      payload: {
        userId,
        email,
        sessionId,
        authMethod: 'oauth2',
        firstName: authData.firstName,
        lastName: authData.lastName,
        ...authData,
      },
    };
  }

  static createUserProfileUpdated(
    userId: string,
    updatedFields: string[],
    previousValues: Record<string, any>,
    newValues: Record<string, any>
  ): UserProfileUpdatedEvent {
    return {
      eventId: crypto.randomUUID(),
      eventType: 'user.profile_updated',
      timestamp: Date.now(),
      version: '1.0',
      source: 'api-gateway',
      payload: {
        userId,
        updatedFields,
        previousValues,
        newValues,
      },
    };
  }

  static createUserLoggedOut(
    userId: string,
    sessionId: string,
    logoutReason: UserLoggedOutEvent['payload']['logoutReason']
  ): UserLoggedOutEvent {
    return {
      eventId: crypto.randomUUID(),
      eventType: 'user.logged_out',
      timestamp: Date.now(),
      version: '1.0',
      source: 'api-gateway',
      payload: {
        userId,
        sessionId,
        logoutReason,
      },
    };
  }

  static createUserDeleted(
    userId: string,
    deletedBy: UserDeletedEvent['payload']['deletedBy'] = 'admin'
  ): UserDeletedEvent {
    return {
      eventId: crypto.randomUUID(),
      eventType: 'user.deleted',
      timestamp: Date.now(),
      version: '1.0',
      source: 'api-gateway',
      payload: {
        userId,
        deletedBy,
      },
    };
  }

  static createUserRoleAssigned(
    userId: string,
    roleName: string,
    assignedBy?: string
  ): UserRoleAssignedEvent {
    return {
      eventId: crypto.randomUUID(),
      eventType: 'user.role_assigned',
      timestamp: Date.now(),
      version: '1.0',
      source: 'api-gateway',
      payload: {
        userId,
        roleName,
        assignedBy,
      },
    };
  }

  static createUserRoleRemoved(
    userId: string,
    roleName: string,
    removedBy?: string
  ): UserRoleRemovedEvent {
    return {
      eventId: crypto.randomUUID(),
      eventType: 'user.role_removed',
      timestamp: Date.now(),
      version: '1.0',
      source: 'api-gateway',
      payload: {
        userId,
        roleName,
        removedBy,
      },
    };
  }
}
