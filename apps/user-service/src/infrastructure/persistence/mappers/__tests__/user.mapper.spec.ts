import { v4 as uuidv4 } from 'uuid';
import { UserMapper } from '../user.mapper';
import { User } from '../../../../domain/aggregates/user.aggregate';
import { UserEntity } from '../../entities/user.entity';
import { Email } from '../../../../domain/value-objects/email.vo';
import { FullName } from '../../../../domain/value-objects/full-name.vo';
import { UserStatus } from '../../../../domain/value-objects/user-status.vo';
import { UserRole } from '../../../../domain/value-objects/user-role.vo';

describe('UserMapper', () => {
  let mapper: UserMapper;

  beforeEach(() => {
    mapper = new UserMapper();
  });

  const createUserEntity = (overrides: Partial<UserEntity> = {}): UserEntity => {
    const entity = new UserEntity();
    entity.id = uuidv4();
    entity.externalAuthId = uuidv4();
    entity.email = 'john.doe@example.com';
    entity.firstName = 'John';
    entity.lastName = 'Doe';
    entity.status = 'active';
    entity.role = 'candidate';
    entity.emailVerified = true;
    entity.avatarUrl = 'https://cdn.example.com/avatar.png';
    entity.bio = 'Software engineer with 10 years of experience';
    entity.phone = '+1234567890';
    entity.timezone = 'America/New_York';
    entity.language = 'en';
    entity.createdAt = new Date('2025-01-15T10:00:00Z');
    entity.updatedAt = new Date('2025-06-20T14:30:00Z');
    entity.lastLoginAt = new Date('2025-06-20T14:00:00Z');
    Object.assign(entity, overrides);
    return entity;
  };

  const createUserDomain = (overrides: {
    id?: string;
    externalAuthId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    status?: UserStatus;
    role?: UserRole;
    avatarUrl?: string;
    bio?: string;
    phone?: string;
    timezone?: string;
    language?: string;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    lastLoginAt?: Date;
  } = {}): User => {
    return User.reconstitute(
      overrides.id ?? uuidv4(),
      overrides.externalAuthId ?? uuidv4(),
      Email.create(overrides.email ?? 'john.doe@example.com'),
      FullName.create(overrides.firstName ?? 'John', overrides.lastName ?? 'Doe'),
      overrides.status ?? UserStatus.active(),
      overrides.role ?? UserRole.candidate(),
      overrides.avatarUrl ?? 'https://cdn.example.com/avatar.png',
      overrides.bio ?? 'Software engineer with 10 years of experience',
      overrides.phone ?? '+1234567890',
      overrides.timezone ?? 'America/New_York',
      overrides.language ?? 'en',
      overrides.emailVerified ?? true,
      overrides.createdAt ?? new Date('2025-01-15T10:00:00Z'),
      overrides.updatedAt ?? new Date('2025-06-20T14:30:00Z'),
      overrides.lastLoginAt ?? new Date('2025-06-20T14:00:00Z'),
    );
  };

  describe('toEntity()', () => {
    it('should create UserEntity from User aggregate with all fields mapped correctly', () => {
      const id = uuidv4();
      const externalAuthId = uuidv4();
      const createdAt = new Date('2025-01-15T10:00:00Z');
      const updatedAt = new Date('2025-06-20T14:30:00Z');
      const lastLoginAt = new Date('2025-06-20T14:00:00Z');

      const user = createUserDomain({
        id,
        externalAuthId,
        email: 'jane.doe@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        status: UserStatus.active(),
        role: UserRole.hr(),
        avatarUrl: 'https://cdn.example.com/jane.png',
        bio: 'HR manager',
        phone: '+9876543210',
        timezone: 'Europe/London',
        language: 'ru',
        emailVerified: true,
        createdAt,
        updatedAt,
        lastLoginAt,
      });

      const entity = mapper.toEntity(user);

      expect(entity).toBeInstanceOf(UserEntity);
      expect(entity.id).toBe(id);
      expect(entity.externalAuthId).toBe(externalAuthId);
      expect(entity.email).toBe('jane.doe@example.com');
      expect(entity.firstName).toBe('Jane');
      expect(entity.lastName).toBe('Doe');
      expect(entity.status).toBe('active');
      expect(entity.role).toBe('hr');
      expect(entity.avatarUrl).toBe('https://cdn.example.com/jane.png');
      expect(entity.bio).toBe('HR manager');
      expect(entity.phone).toBe('+9876543210');
      expect(entity.timezone).toBe('Europe/London');
      expect(entity.language).toBe('ru');
      expect(entity.emailVerified).toBe(true);
      expect(entity.createdAt).toBe(createdAt);
      expect(entity.updatedAt).toBe(updatedAt);
      expect(entity.lastLoginAt).toBe(lastLoginAt);
    });

    it('should map null for optional fields when undefined', () => {
      const user = User.reconstitute(
        uuidv4(),
        uuidv4(),
        Email.create('test@example.com'),
        FullName.create('Test', 'User'),
        UserStatus.active(),
        UserRole.pending(),
        undefined, // avatarUrl
        undefined, // bio
        undefined, // phone
        'UTC',
        'en',
        false,
        new Date(),
        new Date(),
        undefined, // lastLoginAt
      );

      const entity = mapper.toEntity(user);

      expect(entity.avatarUrl).toBeNull();
      expect(entity.bio).toBeNull();
      expect(entity.phone).toBeNull();
      expect(entity.lastLoginAt).toBeNull();
    });

    it('should map suspended status correctly', () => {
      const user = createUserDomain({ status: UserStatus.suspended() });

      const entity = mapper.toEntity(user);

      expect(entity.status).toBe('suspended');
    });

    it('should map all role types correctly', () => {
      const roles: Array<{ role: UserRole; expected: string }> = [
        { role: UserRole.pending(), expected: 'pending' },
        { role: UserRole.candidate(), expected: 'candidate' },
        { role: UserRole.hr(), expected: 'hr' },
        { role: UserRole.admin(), expected: 'admin' },
      ];

      for (const { role, expected } of roles) {
        const user = createUserDomain({ role });
        const entity = mapper.toEntity(user);
        expect(entity.role).toBe(expected);
      }
    });
  });

  describe('toDomain()', () => {
    it('should create User from UserEntity using reconstitute', () => {
      const id = uuidv4();
      const externalAuthId = uuidv4();
      const entity = createUserEntity({ id, externalAuthId });

      const user = mapper.toDomain(entity);

      expect(user.id).toBe(id);
      expect(user.externalAuthId).toBe(externalAuthId);
      expect(user.email.value).toBe('john.doe@example.com');
      expect(user.fullName.firstName).toBe('John');
      expect(user.fullName.lastName).toBe('Doe');
      expect(user.status.value).toBe('active');
      expect(user.role.toString()).toBe('candidate');
      expect(user.avatarUrl).toBe('https://cdn.example.com/avatar.png');
      expect(user.bio).toBe('Software engineer with 10 years of experience');
      expect(user.phone).toBe('+1234567890');
      expect(user.timezone).toBe('America/New_York');
      expect(user.language).toBe('en');
      expect(user.emailVerified).toBe(true);
      expect(user.createdAt).toEqual(new Date('2025-01-15T10:00:00Z'));
      expect(user.updatedAt).toEqual(new Date('2025-06-20T14:30:00Z'));
      expect(user.lastLoginAt).toEqual(new Date('2025-06-20T14:00:00Z'));
    });

    it('should handle null optional fields by converting to undefined', () => {
      const entity = createUserEntity({
        avatarUrl: null,
        bio: null,
        phone: null,
        lastLoginAt: null,
      });

      const user = mapper.toDomain(entity);

      expect(user.avatarUrl).toBeUndefined();
      expect(user.bio).toBeUndefined();
      expect(user.phone).toBeUndefined();
      expect(user.lastLoginAt).toBeUndefined();
    });

    it('should correctly map suspended status from entity', () => {
      const entity = createUserEntity({ status: 'suspended' });

      const user = mapper.toDomain(entity);

      expect(user.status.isSuspended()).toBe(true);
      expect(user.isSuspended).toBe(true);
    });

    it('should correctly map all role types from entity', () => {
      const roleMappings: Array<{ entityRole: UserEntity['role']; check: (u: User) => boolean }> = [
        { entityRole: 'pending', check: (u) => u.isPendingRole },
        { entityRole: 'candidate', check: (u) => u.isCandidateRole },
        { entityRole: 'hr', check: (u) => u.isHRRole },
        { entityRole: 'admin', check: (u) => u.isAdminRole },
      ];

      for (const { entityRole, check } of roleMappings) {
        const entity = createUserEntity({ role: entityRole });
        const user = mapper.toDomain(entity);
        expect(check(user)).toBe(true);
      }
    });
  });

  describe('toDomainList()', () => {
    it('should map array of entities to domain models', () => {
      const entities = [
        createUserEntity({ email: 'user1@example.com', firstName: 'User', lastName: 'One' }),
        createUserEntity({ email: 'user2@example.com', firstName: 'User', lastName: 'Two' }),
        createUserEntity({ email: 'user3@example.com', firstName: 'User', lastName: 'Three' }),
      ];

      const users = mapper.toDomainList(entities);

      expect(users).toHaveLength(3);
      expect(users[0].email.value).toBe('user1@example.com');
      expect(users[1].email.value).toBe('user2@example.com');
      expect(users[2].email.value).toBe('user3@example.com');
      expect(users[0].fullName.firstName).toBe('User');
      expect(users[1].fullName.lastName).toBe('Two');
    });

    it('should return empty array for empty input', () => {
      const users = mapper.toDomainList([]);
      expect(users).toHaveLength(0);
    });
  });

  describe('round-trip', () => {
    it('should preserve all values through toDomain(toEntity(user))', () => {
      const id = uuidv4();
      const externalAuthId = uuidv4();
      const createdAt = new Date('2025-01-01T00:00:00Z');
      const updatedAt = new Date('2025-06-01T12:00:00Z');
      const lastLoginAt = new Date('2025-06-01T11:00:00Z');

      const original = User.reconstitute(
        id,
        externalAuthId,
        Email.create('roundtrip@example.com'),
        FullName.create('Round', 'Trip'),
        UserStatus.active(),
        UserRole.candidate(),
        'https://cdn.example.com/roundtrip.png',
        'A bio for testing',
        '+1111111111',
        'Asia/Tokyo',
        'ja',
        true,
        createdAt,
        updatedAt,
        lastLoginAt,
      );

      const entity = mapper.toEntity(original);
      const restored = mapper.toDomain(entity);

      expect(restored.id).toBe(original.id);
      expect(restored.externalAuthId).toBe(original.externalAuthId);
      expect(restored.email.value).toBe(original.email.value);
      expect(restored.fullName.firstName).toBe(original.fullName.firstName);
      expect(restored.fullName.lastName).toBe(original.fullName.lastName);
      expect(restored.status.value).toBe(original.status.value);
      expect(restored.role.toString()).toBe(original.role.toString());
      expect(restored.avatarUrl).toBe(original.avatarUrl);
      expect(restored.bio).toBe(original.bio);
      expect(restored.phone).toBe(original.phone);
      expect(restored.timezone).toBe(original.timezone);
      expect(restored.language).toBe(original.language);
      expect(restored.emailVerified).toBe(original.emailVerified);
      expect(restored.createdAt).toEqual(original.createdAt);
      expect(restored.updatedAt).toEqual(original.updatedAt);
      expect(restored.lastLoginAt).toEqual(original.lastLoginAt);
    });

    it('should preserve values with null optional fields through round-trip', () => {
      const original = User.reconstitute(
        uuidv4(),
        uuidv4(),
        Email.create('minimal@example.com'),
        FullName.create('Minimal', 'User'),
        UserStatus.active(),
        UserRole.pending(),
        undefined,
        undefined,
        undefined,
        'UTC',
        'en',
        false,
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-01T00:00:00Z'),
        undefined,
      );

      const entity = mapper.toEntity(original);
      const restored = mapper.toDomain(entity);

      expect(restored.avatarUrl).toBeUndefined();
      expect(restored.bio).toBeUndefined();
      expect(restored.phone).toBeUndefined();
      expect(restored.lastLoginAt).toBeUndefined();
      expect(restored.emailVerified).toBe(false);
    });

    it('should preserve User.create() values through round-trip', () => {
      const id = uuidv4();
      const externalAuthId = uuidv4();
      const user = User.create(
        id,
        externalAuthId,
        Email.create('created@example.com'),
        FullName.create('Created', 'User'),
      );

      const entity = mapper.toEntity(user);
      const restored = mapper.toDomain(entity);

      expect(restored.id).toBe(id);
      expect(restored.externalAuthId).toBe(externalAuthId);
      expect(restored.email.value).toBe('created@example.com');
      expect(restored.fullName.firstName).toBe('Created');
      expect(restored.fullName.lastName).toBe('User');
      expect(restored.status.isActive()).toBe(true);
      expect(restored.role.isPending()).toBe(true);
      expect(restored.avatarUrl).toBeUndefined();
      expect(restored.bio).toBeUndefined();
      expect(restored.phone).toBeUndefined();
      expect(restored.timezone).toBe('UTC');
      expect(restored.language).toBe('en');
      expect(restored.emailVerified).toBe(false);
    });
  });
});
