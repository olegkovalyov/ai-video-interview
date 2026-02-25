export interface BaseEvent {
    eventId: string;
    eventType: string;
    timestamp: number;
    version: string;
    source: string;
}
export interface UserCreateCommand extends BaseEvent {
    eventType: 'user.create';
    payload: {
        userId: string;
        externalAuthId: string;
        email: string;
        firstName?: string;
        lastName?: string;
        password?: string;
        registrationMethod?: 'keycloak' | 'oauth' | 'email';
    };
}
export interface UserUpdateCommand extends BaseEvent {
    eventType: 'user.update';
    payload: {
        userId: string;
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
    };
}
export interface UserDeleteCommand extends BaseEvent {
    eventType: 'user.delete';
    payload: {
        userId: string;
        deletedBy: 'admin' | 'user' | 'system';
    };
}
export interface UserSuspendCommand extends BaseEvent {
    eventType: 'user.suspend';
    payload: {
        userId: string;
        reason?: string;
    };
}
export interface UserActivateCommand extends BaseEvent {
    eventType: 'user.activate';
    payload: {
        userId: string;
    };
}
export interface UserAssignRoleCommand extends BaseEvent {
    eventType: 'user.assign_role';
    payload: {
        userId: string;
        roleName: string;
        assignedBy?: string;
    };
}
export interface UserRemoveRoleCommand extends BaseEvent {
    eventType: 'user.remove_role';
    payload: {
        userId: string;
        roleName: string;
        removedBy?: string;
    };
}
export type UserCommand = UserCreateCommand | UserUpdateCommand | UserDeleteCommand | UserSuspendCommand | UserActivateCommand | UserAssignRoleCommand | UserRemoveRoleCommand;
export interface UserCreatedEvent extends BaseEvent {
    eventType: 'user.created';
    source: 'user-service';
    payload: {
        userId: string;
        externalAuthId: string;
        email: string;
        firstName: string;
        lastName: string;
        status: string;
        role: string;
        createdAt: string;
    };
}
export interface UserUpdatedEvent extends BaseEvent {
    eventType: 'user.updated';
    source: 'user-service';
    payload: {
        userId: string;
        externalAuthId: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        updatedAt: string;
    };
}
export interface UserDeletedEvent extends BaseEvent {
    eventType: 'user.deleted';
    source: 'user-service';
    payload: {
        userId: string;
        externalAuthId: string;
        deletedBy: 'admin' | 'user' | 'system';
        deletedAt: string;
    };
}
export interface UserSuspendedEvent extends BaseEvent {
    eventType: 'user.suspended';
    source: 'user-service';
    payload: {
        userId: string;
        externalAuthId: string;
        suspendedAt: string;
    };
}
export interface UserActivatedEvent extends BaseEvent {
    eventType: 'user.activated';
    source: 'user-service';
    payload: {
        userId: string;
        externalAuthId: string;
        activatedAt: string;
    };
}
export interface UserRoleAssignedEvent extends BaseEvent {
    eventType: 'user.role_assigned';
    source: 'user-service';
    payload: {
        userId: string;
        externalAuthId: string;
        roleName: string;
        assignedAt: string;
    };
}
export interface UserRoleRemovedEvent extends BaseEvent {
    eventType: 'user.role_removed';
    source: 'user-service';
    payload: {
        userId: string;
        externalAuthId: string;
        roleName: string;
        removedAt: string;
    };
}
export interface UserRoleSelectedEvent extends BaseEvent {
    eventType: 'user.role-selected';
    source: 'user-service';
    payload: {
        userId: string;
        externalAuthId: string;
        email: string;
        role: 'candidate' | 'hr';
        selectedAt: string;
    };
}
export interface UserAuthenticatedEvent extends BaseEvent {
    eventType: 'user.authenticated';
    payload: {
        externalAuthId: string;
        email: string;
        firstName?: string;
        lastName?: string;
        authMethod: 'oauth2' | 'jwt_refresh';
        sessionId: string;
        ipAddress?: string;
        userAgent?: string;
    };
}
export interface UserLoggedOutEvent extends BaseEvent {
    eventType: 'user.logged_out';
    payload: {
        externalAuthId: string;
        sessionId: string;
        logoutReason: 'user_action' | 'token_expired' | 'admin_action';
    };
}
export type UserIntegrationEvent = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent | UserSuspendedEvent | UserActivatedEvent | UserRoleAssignedEvent | UserRoleRemovedEvent | UserRoleSelectedEvent;
export type UserAuthEvent = UserAuthenticatedEvent | UserLoggedOutEvent;
export declare class UserCommandFactory {
    static createUserCreate(userId: string, externalAuthId: string, email: string, firstName?: string, lastName?: string, password?: string): UserCreateCommand;
    static createUserUpdate(userId: string, firstName?: string, lastName?: string, avatarUrl?: string): UserUpdateCommand;
    static createUserDelete(userId: string, deletedBy?: 'admin' | 'user' | 'system'): UserDeleteCommand;
    static createUserSuspend(userId: string, reason?: string): UserSuspendCommand;
    static createUserActivate(userId: string): UserActivateCommand;
    static createUserAssignRole(userId: string, roleName: string, assignedBy?: string): UserAssignRoleCommand;
    static createUserRemoveRole(userId: string, roleName: string, removedBy?: string): UserRemoveRoleCommand;
}
export declare class AuthEventFactory {
    static createUserAuthenticated(externalAuthId: string, email: string, sessionId: string, authData?: Partial<UserAuthenticatedEvent['payload']>): UserAuthenticatedEvent;
    static createUserLoggedOut(externalAuthId: string, sessionId: string, logoutReason: UserLoggedOutEvent['payload']['logoutReason']): UserLoggedOutEvent;
}
