"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthEventFactory = exports.UserCommandFactory = void 0;
class UserCommandFactory {
    static createUserCreate(userId, externalAuthId, email, firstName, lastName, password) {
        return {
            eventId: crypto.randomUUID(),
            eventType: 'user.create',
            timestamp: Date.now(),
            version: '1.0',
            source: 'api-gateway',
            payload: {
                userId,
                externalAuthId,
                email,
                firstName,
                lastName,
                password,
                registrationMethod: 'keycloak',
            },
        };
    }
    static createUserUpdate(userId, firstName, lastName, avatarUrl) {
        return {
            eventId: crypto.randomUUID(),
            eventType: 'user.update',
            timestamp: Date.now(),
            version: '1.0',
            source: 'api-gateway',
            payload: {
                userId,
                firstName,
                lastName,
                avatarUrl,
            },
        };
    }
    static createUserDelete(userId, deletedBy = 'admin') {
        return {
            eventId: crypto.randomUUID(),
            eventType: 'user.delete',
            timestamp: Date.now(),
            version: '1.0',
            source: 'api-gateway',
            payload: {
                userId,
                deletedBy,
            },
        };
    }
    static createUserSuspend(userId, reason) {
        return {
            eventId: crypto.randomUUID(),
            eventType: 'user.suspend',
            timestamp: Date.now(),
            version: '1.0',
            source: 'api-gateway',
            payload: {
                userId,
                reason,
            },
        };
    }
    static createUserActivate(userId) {
        return {
            eventId: crypto.randomUUID(),
            eventType: 'user.activate',
            timestamp: Date.now(),
            version: '1.0',
            source: 'api-gateway',
            payload: {
                userId,
            },
        };
    }
    static createUserAssignRole(userId, roleName, assignedBy) {
        return {
            eventId: crypto.randomUUID(),
            eventType: 'user.assign_role',
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
    static createUserRemoveRole(userId, roleName, removedBy) {
        return {
            eventId: crypto.randomUUID(),
            eventType: 'user.remove_role',
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
exports.UserCommandFactory = UserCommandFactory;
class AuthEventFactory {
    static createUserAuthenticated(externalAuthId, email, sessionId, authData) {
        return {
            eventId: crypto.randomUUID(),
            eventType: 'user.authenticated',
            timestamp: Date.now(),
            version: '1.0',
            source: 'api-gateway',
            payload: {
                externalAuthId,
                email,
                sessionId,
                authMethod: 'oauth2',
                ...authData,
            },
        };
    }
    static createUserLoggedOut(externalAuthId, sessionId, logoutReason) {
        return {
            eventId: crypto.randomUUID(),
            eventType: 'user.logged_out',
            timestamp: Date.now(),
            version: '1.0',
            source: 'api-gateway',
            payload: {
                externalAuthId,
                sessionId,
                logoutReason,
            },
        };
    }
}
exports.AuthEventFactory = AuthEventFactory;
//# sourceMappingURL=user.events.js.map