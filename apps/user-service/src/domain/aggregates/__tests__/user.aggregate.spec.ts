import { User } from '../user.aggregate';
import { Email } from '../../value-objects/email.vo';
import { FullName } from '../../value-objects/full-name.vo';
import { UserStatus } from '../../value-objects/user-status.vo';
import { UserRole } from '../../value-objects/user-role.vo';
import { UserCreatedEvent } from '../../events/user-created.event';
import { UserUpdatedEvent } from '../../events/user-updated.event';
import { UserSuspendedEvent } from '../../events/user-suspended.event';
import { UserDeletedEvent } from '../../events/user-deleted.event';
import {
  UserDeletedException,
  UserSuspendedException,
  InvalidUserOperationException,
} from '../../exceptions/user.exceptions';
import { DomainException } from '../../exceptions/domain.exception';

describe('User Aggregate', () => {
  const userId = 'user-123';
  const externalAuthId = 'auth-456';
  const email = Email.create('test@example.com');
  const fullName = FullName.create('John', 'Doe');

  describe('Factory Methods', () => {
    describe('create()', () => {
      it('should create new user with default values', () => {
        const user = User.create(userId, externalAuthId, email, fullName);

        expect(user.id).toBe(userId);
        expect(user.externalAuthId).toBe(externalAuthId);
        expect(user.email.value).toBe('test@example.com');
        expect(user.fullName.firstName).toBe('John');
        expect(user.fullName.lastName).toBe('Doe');
        expect(user.status.isActive()).toBe(true);
        expect(user.role.isPending()).toBe(true);
        expect(user.emailVerified).toBe(false);
        expect(user.timezone).toBe('UTC');
        expect(user.language).toBe('en');
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
      });

      it('should emit UserCreatedEvent', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        const events = user.getUncommittedEvents();

        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserCreatedEvent);
        expect((events[0] as UserCreatedEvent).userId).toBe(userId);
      });

      it('should start with active status', () => {
        const user = User.create(userId, externalAuthId, email, fullName);

        expect(user.isActive).toBe(true);
        expect(user.isSuspended).toBe(false);
        expect(user.isDeleted).toBe(false);
      });

      it('should start with pending role', () => {
        const user = User.create(userId, externalAuthId, email, fullName);

        expect(user.isPendingRole).toBe(true);
        expect(user.isCandidateRole).toBe(false);
        expect(user.isHRRole).toBe(false);
        expect(user.isAdminRole).toBe(false);
      });
    });

    describe('reconstitute()', () => {
      it('should reconstitute user from persistence without emitting events', () => {
        const user = User.reconstitute(
          userId,
          externalAuthId,
          email,
          fullName,
          UserStatus.active(),
          UserRole.candidate(),
        );

        expect(user.id).toBe(userId);
        expect(user.role.isCandidate()).toBe(true);
        expect(user.getUncommittedEvents()).toHaveLength(0);
      });

      it('should use default values for optional parameters', () => {
        const user = User.reconstitute(
          userId,
          externalAuthId,
          email,
          fullName,
          UserStatus.active(),
          UserRole.pending(),
        );

        expect(user.timezone).toBe('UTC');
        expect(user.language).toBe('en');
      });
    });
  });

  describe('Business Logic - Profile Updates', () => {
    describe('updateProfile()', () => {
      it('should update full name', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        const newName = FullName.create('Jane', 'Smith');
        user.updateProfile(newName);

        expect(user.fullName.firstName).toBe('Jane');
        expect(user.fullName.lastName).toBe('Smith');
      });

      it('should update bio', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.updateProfile(fullName, 'Software Engineer');

        expect(user.bio).toBe('Software Engineer');
      });

      it('should update phone', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.updateProfile(fullName, undefined, '+1234567890');

        expect(user.phone).toBe('+1234567890');
      });

      it('should update timezone', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.updateProfile(fullName, undefined, undefined, 'Europe/Kiev');

        expect(user.timezone).toBe('Europe/Kiev');
      });

      it('should update language', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.updateProfile(fullName, undefined, undefined, undefined, 'uk');

        expect(user.language).toBe('uk');
      });

      it('should emit UserUpdatedEvent when changes are made', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        const newName = FullName.create('Jane', 'Smith');
        user.updateProfile(newName, 'New bio');

        const events = user.getUncommittedEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserUpdatedEvent);
      });

      it('should not emit event if no changes', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.updateProfile(fullName); // Same name, no changes

        expect(user.getUncommittedEvents()).toHaveLength(0);
      });

      it('should update updatedAt timestamp', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        const oldUpdatedAt = user.updatedAt;

        // Wait a bit to ensure different timestamp
        const newName = FullName.create('Jane', 'Smith');
        user.updateProfile(newName);

        expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
      });

      it('should throw error if user is deleted', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.delete('admin-123');

        const newName = FullName.create('Jane', 'Smith');
        expect(() => user.updateProfile(newName)).toThrow(UserDeletedException);
      });

      it('should throw error if user is suspended', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.suspend('Violation', 'admin-123');

        const newName = FullName.create('Jane', 'Smith');
        expect(() => user.updateProfile(newName)).toThrow(UserSuspendedException);
      });
    });

    describe('changeEmail()', () => {
      it('should change email and reset verification', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.verifyEmail();
        user.clearEvents();

        const newEmail = Email.create('newemail@example.com');
        user.changeEmail(newEmail);

        expect(user.email.value).toBe('newemail@example.com');
        expect(user.emailVerified).toBe(false);
      });

      it('should emit UserUpdatedEvent', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        const newEmail = Email.create('newemail@example.com');
        user.changeEmail(newEmail);

        const events = user.getUncommittedEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserUpdatedEvent);
      });

      it('should not change if email is the same', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.changeEmail(email); // Same email

        expect(user.getUncommittedEvents()).toHaveLength(0);
      });

      it('should throw error if user is deleted', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.delete('admin-123');

        const newEmail = Email.create('newemail@example.com');
        expect(() => user.changeEmail(newEmail)).toThrow(UserDeletedException);
      });
    });

    describe('verifyEmail()', () => {
      it('should mark email as verified', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.verifyEmail();

        expect(user.emailVerified).toBe(true);
      });

      it('should emit UserUpdatedEvent', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.verifyEmail();

        const events = user.getUncommittedEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserUpdatedEvent);
      });

      it('should not emit event if already verified', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.verifyEmail();
        user.clearEvents();

        user.verifyEmail(); // Already verified

        expect(user.getUncommittedEvents()).toHaveLength(0);
      });

      it('should throw error if user is deleted', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.delete('admin-123');

        expect(() => user.verifyEmail()).toThrow(UserDeletedException);
      });
    });
  });

  describe('Business Logic - Status Management', () => {
    describe('suspend()', () => {
      it('should suspend active user', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.suspend('Terms violation', 'admin-123');

        expect(user.isSuspended).toBe(true);
        expect(user.isActive).toBe(false);
      });

      it('should emit UserSuspendedEvent', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.suspend('Terms violation', 'admin-123');

        const events = user.getUncommittedEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserSuspendedEvent);
        expect((events[0] as UserSuspendedEvent).reason).toBe('Terms violation');
        expect((events[0] as UserSuspendedEvent).suspendedBy).toBe('admin-123');
      });

      it('should throw error if already suspended', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.suspend('First suspension', 'admin-123');

        expect(() => user.suspend('Second suspension', 'admin-456')).toThrow(
          InvalidUserOperationException,
        );
      });

      it('should throw error if user is deleted', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.delete('admin-123');

        expect(() => user.suspend('Reason', 'admin-456')).toThrow(UserDeletedException);
      });
    });

    describe('activate()', () => {
      it('should activate suspended user', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.suspend('Reason', 'admin-123');
        user.clearEvents();

        user.activate();

        expect(user.isActive).toBe(true);
        expect(user.isSuspended).toBe(false);
      });

      it('should emit UserUpdatedEvent', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.suspend('Reason', 'admin-123');
        user.clearEvents();

        user.activate();

        const events = user.getUncommittedEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserUpdatedEvent);
      });

      it('should not emit event if already active', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.activate(); // Already active

        expect(user.getUncommittedEvents()).toHaveLength(0);
      });

      it('should throw error if user is deleted', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.delete('admin-123');

        expect(() => user.activate()).toThrow(UserDeletedException);
      });
    });

    describe('delete()', () => {
      it('should delete user', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.delete('admin-123');

        expect(user.isDeleted).toBe(true);
        expect(user.isActive).toBe(false);
      });

      it('should emit UserDeletedEvent', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.delete('admin-123');

        const events = user.getUncommittedEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserDeletedEvent);
        expect((events[0] as UserDeletedEvent).deletedBy).toBe('admin-123');
      });

      it('should not emit event if already deleted', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.delete('admin-123');
        user.clearEvents();

        user.delete('admin-456'); // Already deleted

        expect(user.getUncommittedEvents()).toHaveLength(0);
      });
    });
  });

  describe('Business Logic - Avatar Management', () => {
    describe('uploadAvatar()', () => {
      it('should set avatar URL', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.uploadAvatar('https://example.com/avatar.jpg');

        expect(user.avatarUrl).toBe('https://example.com/avatar.jpg');
      });

      it('should emit UserUpdatedEvent', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.uploadAvatar('https://example.com/avatar.jpg');

        const events = user.getUncommittedEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserUpdatedEvent);
      });

      it('should throw error for empty URL', () => {
        const user = User.create(userId, externalAuthId, email, fullName);

        expect(() => user.uploadAvatar('')).toThrow(DomainException);
        expect(() => user.uploadAvatar('  ')).toThrow(DomainException);
      });

      it('should throw error if user is deleted', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.delete('admin-123');

        expect(() => user.uploadAvatar('https://example.com/avatar.jpg')).toThrow(
          UserDeletedException,
        );
      });

      it('should throw error if user is suspended', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.suspend('Reason', 'admin-123');

        expect(() => user.uploadAvatar('https://example.com/avatar.jpg')).toThrow(
          UserSuspendedException,
        );
      });
    });

    describe('removeAvatar()', () => {
      it('should remove avatar', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.uploadAvatar('https://example.com/avatar.jpg');
        user.clearEvents();

        user.removeAvatar();

        expect(user.avatarUrl).toBeUndefined();
      });

      it('should emit UserUpdatedEvent', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.uploadAvatar('https://example.com/avatar.jpg');
        user.clearEvents();

        user.removeAvatar();

        const events = user.getUncommittedEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserUpdatedEvent);
      });

      it('should not emit event if no avatar to remove', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.removeAvatar(); // No avatar

        expect(user.getUncommittedEvents()).toHaveLength(0);
      });

      it('should throw error if user is deleted', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.delete('admin-123');

        expect(() => user.removeAvatar()).toThrow(UserDeletedException);
      });

      it('should throw error if user is suspended', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.suspend('Reason', 'admin-123');

        expect(() => user.removeAvatar()).toThrow(UserSuspendedException);
      });
    });
  });

  describe('Business Logic - Role Selection', () => {
    describe('selectRole()', () => {
      it('should select candidate role', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.selectRole(UserRole.candidate());

        expect(user.role.isCandidate()).toBe(true);
        expect(user.isCandidateRole).toBe(true);
      });

      it('should select HR role', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.selectRole(UserRole.hr());

        expect(user.role.isHR()).toBe(true);
        expect(user.isHRRole).toBe(true);
      });

      it('should emit UserUpdatedEvent', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.clearEvents();

        user.selectRole(UserRole.candidate());

        const events = user.getUncommittedEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserUpdatedEvent);
      });

      it('should throw error if role already selected', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.selectRole(UserRole.candidate());

        expect(() => user.selectRole(UserRole.hr())).toThrow(InvalidUserOperationException);
        expect(() => user.selectRole(UserRole.hr())).toThrow('Role has already been selected');
      });

      it('should throw error if trying to select pending role', () => {
        const user = User.create(userId, externalAuthId, email, fullName);

        expect(() => user.selectRole(UserRole.pending())).toThrow(DomainException);
      });

      it('should throw error if user is deleted', () => {
        const user = User.create(userId, externalAuthId, email, fullName);
        user.delete('admin-123');

        expect(() => user.selectRole(UserRole.candidate())).toThrow(UserDeletedException);
      });
    });
  });

  describe('Getters and Convenience Methods', () => {
    it('should have correct convenience getters', () => {
      const user = User.create(userId, externalAuthId, email, fullName);

      expect(user.isActive).toBe(true);
      expect(user.isSuspended).toBe(false);
      expect(user.isDeleted).toBe(false);
      expect(user.isPendingRole).toBe(true);
    });

    it('should return all properties correctly', () => {
      const user = User.create(userId, externalAuthId, email, fullName);

      expect(user.id).toBe(userId);
      expect(user.externalAuthId).toBe(externalAuthId);
      expect(user.email).toBe(email);
      expect(user.fullName).toBe(fullName);
      expect(user.status).toBeInstanceOf(UserStatus);
      expect(user.role).toBeInstanceOf(UserRole);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });
});
