import { User } from '../../../../src/domain/aggregates/user.aggregate';
import { Email } from '../../../../src/domain/value-objects/email.vo';
import { FullName } from '../../../../src/domain/value-objects/full-name.vo';
import { UserStatus } from '../../../../src/domain/value-objects/user-status.vo';
import { UserCreatedEvent } from '../../../../src/domain/events/user-created.event';
import { UserUpdatedEvent } from '../../../../src/domain/events/user-updated.event';
import { UserSuspendedEvent } from '../../../../src/domain/events/user-suspended.event';
import { UserDeletedEvent } from '../../../../src/domain/events/user-deleted.event';
import {
  UserDeletedException,
  UserSuspendedException,
  InvalidUserOperationException,
} from '../../../../src/domain/exceptions/user.exceptions';
import { DomainException } from '../../../../src/domain/exceptions/domain.exception';

describe('User Aggregate', () => {
  const userId = 'user-123';
  const keycloakId = 'keycloak-123';
  const email = Email.create('test@example.com');
  const fullName = FullName.create('John', 'Doe');

  describe('create', () => {
    it('should create user with valid data', () => {
      const user = User.create(userId, keycloakId, email, fullName);

      expect(user.id).toBe(userId);
      expect(user.keycloakId).toBe(keycloakId);
      expect(user.email.value).toBe('test@example.com');
      expect(user.fullName.firstName).toBe('John');
      expect(user.fullName.lastName).toBe('Doe');
      expect(user.isActive).toBe(true);
      expect(user.isSuspended).toBe(false);
      expect(user.isDeleted).toBe(false);
      expect(user.emailVerified).toBe(false);
      expect(user.avatarUrl).toBeUndefined();
      expect(user.bio).toBeUndefined();
    });

    it('should emit UserCreatedEvent', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      const events = user.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
      expect((events[0] as UserCreatedEvent).userId).toBe(userId);
      expect((events[0] as UserCreatedEvent).email).toBe('test@example.com');
      expect((events[0] as UserCreatedEvent).keycloakId).toBe(keycloakId);
    });

    it('should set timestamps', () => {
      const user = User.create(userId, keycloakId, email, fullName);

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute user without emitting events', () => {
      const user = User.reconstitute(
        userId,
        keycloakId,
        email,
        fullName,
        UserStatus.active(),
        'https://example.com/avatar.jpg',
        'Bio text',
        '+1234567890',
        'UTC',        // timezone
        'en',         // language
        true,         // emailVerified
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );

      expect(user.id).toBe(userId);
      expect(user.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(user.bio).toBe('Bio text');
      expect(user.phone).toBe('+1234567890');
      expect(user.emailVerified).toBe(true);

      // Should not emit events
      expect(user.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents(); // Clear creation event

      const newFullName = FullName.create('Jane', 'Smith');
      user.updateProfile(newFullName, 'New bio', '+1234567890');

      expect(user.fullName.firstName).toBe('Jane');
      expect(user.fullName.lastName).toBe('Smith');
      expect(user.bio).toBe('New bio');
      expect(user.phone).toBe('+1234567890');
    });

    it('should emit UserUpdatedEvent with changes', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      const newFullName = FullName.create('Jane', 'Smith');
      user.updateProfile(newFullName, 'New bio');

      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserUpdatedEvent);
      
      const event = events[0] as UserUpdatedEvent;
      expect(event.changes.fullName).toBeDefined();
      expect(event.changes.bio).toBe('New bio');
    });

    it('should not emit event if nothing changed', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      user.updateProfile(fullName); // Same name

      expect(user.getUncommittedEvents()).toHaveLength(0);
    });

    it('should throw if user is deleted', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.delete('admin-id');

      expect(() => user.updateProfile(fullName)).toThrow(UserDeletedException);
    });

    it('should throw if user is suspended', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.suspend('Policy violation', 'admin-id');

      expect(() => user.updateProfile(fullName)).toThrow(UserSuspendedException);
    });
  });

  describe('changeEmail', () => {
    it('should change email successfully', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      const newEmail = Email.create('newemail@example.com');
      user.changeEmail(newEmail);

      expect(user.email.value).toBe('newemail@example.com');
      expect(user.emailVerified).toBe(false); // Should reset verification
    });

    it('should emit UserUpdatedEvent', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      const newEmail = Email.create('newemail@example.com');
      user.changeEmail(newEmail);

      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as UserUpdatedEvent).changes.email).toBe('newemail@example.com');
      expect((events[0] as UserUpdatedEvent).changes.emailVerified).toBe(false);
    });

    it('should not emit event if email unchanged', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      user.changeEmail(email); // Same email

      expect(user.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      user.verifyEmail();

      expect(user.emailVerified).toBe(true);
      expect(user.getUncommittedEvents()).toHaveLength(1);
    });

    it('should not emit event if already verified', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.verifyEmail();
      user.clearEvents();

      user.verifyEmail(); // Already verified

      expect(user.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('suspend', () => {
    it('should suspend active user', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      user.suspend('Policy violation', 'admin-id');

      expect(user.isSuspended).toBe(true);
      expect(user.isActive).toBe(false);
    });

    it('should emit UserSuspendedEvent', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      user.suspend('Policy violation', 'admin-id');

      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserSuspendedEvent);
      
      const event = events[0] as UserSuspendedEvent;
      expect(event.reason).toBe('Policy violation');
      expect(event.suspendedBy).toBe('admin-id');
    });

    it('should throw if user already suspended', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.suspend('First reason', 'admin-1');

      expect(() => user.suspend('Second reason', 'admin-2'))
        .toThrow(InvalidUserOperationException);
      expect(() => user.suspend('Second reason', 'admin-2'))
        .toThrow('already suspended');
    });

    it('should throw if user is deleted', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.delete('admin-id');

      expect(() => user.suspend('reason', 'admin-id')).toThrow(UserDeletedException);
    });
  });

  describe('activate', () => {
    it('should activate suspended user', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.suspend('Policy violation', 'admin-id');
      user.clearEvents();

      user.activate();

      expect(user.isActive).toBe(true);
      expect(user.isSuspended).toBe(false);
    });

    it('should emit UserUpdatedEvent', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.suspend('Policy violation', 'admin-id');
      user.clearEvents();

      user.activate();

      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as UserUpdatedEvent).changes.status).toBe('active');
    });

    it('should not emit event if already active', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      user.activate(); // Already active

      expect(user.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should soft delete user', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      user.delete('admin-id');

      expect(user.isDeleted).toBe(true);
      expect(user.isActive).toBe(false);
    });

    it('should emit UserDeletedEvent', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      user.delete('admin-id');

      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserDeletedEvent);
      expect((events[0] as UserDeletedEvent).deletedBy).toBe('admin-id');
    });

    it('should not emit event if already deleted', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.delete('admin-1');
      user.clearEvents();

      user.delete('admin-2'); // Already deleted

      expect(user.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      const avatarUrl = 'https://example.com/avatar.jpg';
      user.uploadAvatar(avatarUrl);

      expect(user.avatarUrl).toBe(avatarUrl);
    });

    it('should emit UserUpdatedEvent', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      user.uploadAvatar('https://example.com/avatar.jpg');

      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as UserUpdatedEvent).changes.avatarUrl).toBeDefined();
    });

    it('should throw on empty avatar URL', () => {
      const user = User.create(userId, keycloakId, email, fullName);

      expect(() => user.uploadAvatar('')).toThrow(DomainException);
      expect(() => user.uploadAvatar('   ')).toThrow(DomainException);
    });

    it('should throw if user is deleted', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.delete('admin-id');

      expect(() => user.uploadAvatar('https://example.com/avatar.jpg'))
        .toThrow(UserDeletedException);
    });

    it('should throw if user is suspended', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.suspend('reason', 'admin-id');

      expect(() => user.uploadAvatar('https://example.com/avatar.jpg'))
        .toThrow(UserSuspendedException);
    });
  });

  describe('removeAvatar', () => {
    it('should remove avatar successfully', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.uploadAvatar('https://example.com/avatar.jpg');
      user.clearEvents();

      user.removeAvatar();

      expect(user.avatarUrl).toBeUndefined();
    });

    it('should emit UserUpdatedEvent', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.uploadAvatar('https://example.com/avatar.jpg');
      user.clearEvents();

      user.removeAvatar();

      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as UserUpdatedEvent).changes.avatarUrl).toBeNull();
    });

    it('should not emit event if no avatar to remove', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.clearEvents();

      user.removeAvatar(); // No avatar

      expect(user.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('invariants', () => {
    it('should prevent operations on deleted user', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.delete('admin-id');

      expect(() => user.updateProfile(fullName)).toThrow(UserDeletedException);
      expect(() => user.changeEmail(email)).toThrow(UserDeletedException);
      expect(() => user.verifyEmail()).toThrow(UserDeletedException);
      expect(() => user.suspend('reason', 'admin')).toThrow(UserDeletedException);
      expect(() => user.activate()).toThrow(UserDeletedException);
      expect(() => user.uploadAvatar('url')).toThrow(UserDeletedException);
      expect(() => user.removeAvatar()).toThrow(UserDeletedException);
    });

    it('should prevent operations on suspended user', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.suspend('Policy violation', 'admin-id');

      expect(() => user.updateProfile(fullName)).toThrow(UserSuspendedException);
      expect(() => user.uploadAvatar('url')).toThrow(UserSuspendedException);
      expect(() => user.removeAvatar()).toThrow(UserSuspendedException);
    });

    it('should allow read operations on suspended user', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      user.suspend('Policy violation', 'admin-id');

      // These should not throw
      expect(user.id).toBe(userId);
      expect(user.email).toBe(email);
      expect(user.isSuspended).toBe(true);
    });
  });

  describe('event management', () => {
    it('should accumulate multiple events', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      
      expect(user.getUncommittedEvents()).toHaveLength(1); // UserCreatedEvent

      user.updateProfile(FullName.create('Jane', 'Doe'));
      expect(user.getUncommittedEvents()).toHaveLength(2);

      user.uploadAvatar('https://example.com/avatar.jpg');
      expect(user.getUncommittedEvents()).toHaveLength(3);
    });

    it('should clear events after commit', () => {
      const user = User.create(userId, keycloakId, email, fullName);
      expect(user.getUncommittedEvents()).toHaveLength(1);

      user.clearEvents();
      expect(user.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
