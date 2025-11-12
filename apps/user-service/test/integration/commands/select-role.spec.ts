import { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedUser,
} from '../setup';
import { SelectRoleCommand } from '../../../src/application/commands/select-role/select-role.command';
import { UserEntity } from '../../../src/infrastructure/persistence/entities/user.entity';

describe('SelectRoleCommand Integration', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    commandBus = app.get(CommandBus);
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Success Cases - Candidate Role', () => {
    it('should select candidate role for pending user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Future',
        lastName: 'Candidate',
        status: 'active',
        role: 'pending',
      });

      const command = new SelectRoleCommand(userId, 'candidate');

      // Act
      await commandBus.execute(command);

      // Assert - User role updated
      const userEntity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(userEntity!.role).toBe('candidate');

      // Assert - CandidateProfile created
      const profiles = await dataSource.query(
        'SELECT * FROM candidate_profiles WHERE user_id = $1',
        [userId],
      );

      expect(profiles.length).toBe(1);
      expect(profiles[0].user_id).toBe(userId);
    });

    it('should create empty candidate profile with default values', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      // Act
      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      // Assert
      const profiles = await dataSource.query(
        'SELECT * FROM candidate_profiles WHERE user_id = $1',
        [userId],
      );

      expect(profiles.length).toBe(1);
      expect(profiles[0].experience_level).toBeNull();
    });
  });

  describe('Success Cases - HR Role', () => {
    it('should select hr role for pending user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Future',
        lastName: 'HR',
        status: 'active',
        role: 'pending',
      });

      const command = new SelectRoleCommand(userId, 'hr');

      // Act
      await commandBus.execute(command);

      // Assert - User role updated
      const userEntity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(userEntity!.role).toBe('hr');

      // Assert - No HR profile entity anymore (HR uses companies now)
      // Just verify user role updated
      expect(userEntity!.role).toBe('hr');
    });

    it('should create empty hr profile with default values', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      // Act
      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      // Assert - No HR profile entity anymore (HR uses companies now)
      const userEntity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });
      
      expect(userEntity!.role).toBe('hr');
    });
  });

  describe('Success Cases - Admin Role', () => {
    it('should select admin role for pending user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'admin@example.com',
        firstName: 'Future',
        lastName: 'Admin',
        status: 'active',
        role: 'pending',
      });

      const command = new SelectRoleCommand(userId, 'admin');

      // Act
      await commandBus.execute(command);

      // Assert - User role updated
      const userEntity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(userEntity!.role).toBe('admin');

      // Assert - NO profile created for admin
      const profiles = await dataSource.query(
        'SELECT * FROM candidate_profiles WHERE user_id = $1',
        [userId],
      );

      expect(profiles.length).toBe(0);
    });
  });

  describe('Error Cases', () => {
    it('should throw error when user not found', async () => {
      // Arrange
      const nonExistentUserId = uuidv4();
      const command = new SelectRoleCommand(nonExistentUserId, 'candidate');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow('not found');
    });

    it('should throw error when role already selected', async () => {
      // Arrange - User with candidate role already selected
      const userId = await seedUser(dataSource, {
        email: 'already@example.com',
        firstName: 'Already',
        lastName: 'Selected',
        role: 'candidate',
      });

      const command = new SelectRoleCommand(userId, 'hr');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow(
        'already been selected',
      );
    });

    it('should throw error when trying to change from candidate to hr', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'candidate',
      });

      // Act & Assert
      await expect(
        commandBus.execute(new SelectRoleCommand(userId, 'hr')),
      ).rejects.toThrow();
    });

    it('should throw error when trying to change from hr to candidate', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'hr',
      });

      // Act & Assert
      await expect(
        commandBus.execute(new SelectRoleCommand(userId, 'candidate')),
      ).rejects.toThrow();
    });

    it('should throw error when selecting same role twice', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'pending@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'pending',
      });

      // Act - Select role first time
      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      // Assert - Second selection should fail
      await expect(
        commandBus.execute(new SelectRoleCommand(userId, 'candidate')),
      ).rejects.toThrow();
    });
  });

  describe('Business Rules', () => {
    it('should update updatedAt timestamp when selecting role', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'pending',
      });

      const entityBefore = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });
      const updatedAtBefore = entityBefore!.updatedAt;

      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act
      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      // Assert
      const entityAfter = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entityAfter!.updatedAt.getTime()).toBeGreaterThan(
        updatedAtBefore.getTime(),
      );
    });

    it('should preserve user data when selecting role', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'preserve@example.com',
        firstName: 'Preserve',
        lastName: 'Data',
        status: 'active',
        role: 'pending',
      });

      // Act
      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.email).toBe('preserve@example.com');
      expect(entity!.firstName).toBe('Preserve');
      expect(entity!.lastName).toBe('Data');
      expect(entity!.status).toBe('active');
      expect(entity!.role).toBe('hr');
    });

    it('should allow role selection for suspended users', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'suspended@example.com',
        firstName: 'Suspended',
        lastName: 'User',
        status: 'suspended',
        role: 'pending',
      });

      // Act
      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.role).toBe('candidate');
      expect(entity!.status).toBe('suspended');
    });
  });

  describe('Multiple Users', () => {
    it('should allow different users to select different roles', async () => {
      // Arrange
      const candidateUserId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Candidate',
        lastName: 'User',
        role: 'pending',
      });

      const hrUserId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
        role: 'pending',
      });

      const adminUserId = await seedUser(dataSource, {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'pending',
      });

      // Act
      await commandBus.execute(
        new SelectRoleCommand(candidateUserId, 'candidate'),
      );
      await commandBus.execute(new SelectRoleCommand(hrUserId, 'hr'));
      await commandBus.execute(new SelectRoleCommand(adminUserId, 'admin'));

      // Assert
      const candidateUser = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: candidateUserId } });
      const hrUser = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: hrUserId } });
      const adminUser = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: adminUserId } });

      expect(candidateUser!.role).toBe('candidate');
      expect(hrUser!.role).toBe('hr');
      expect(adminUser!.role).toBe('admin');

      // Check profiles - only candidate has profile now
      const profiles = await dataSource.query(
        'SELECT * FROM candidate_profiles',
      );

      expect(profiles.length).toBe(1);
      expect(profiles[0].user_id).toBe(candidateUserId);
    });
  });
});
