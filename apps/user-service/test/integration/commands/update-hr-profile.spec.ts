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
import { UpdateHRProfileCommand } from '../../../src/application/commands/update-hr-profile/update-hr-profile.command';
import { SelectRoleCommand } from '../../../src/application/commands/select-role/select-role.command';
import { HRProfileEntity } from '../../../src/infrastructure/persistence/entities/hr-profile.entity';

describe('UpdateHRProfileCommand Integration', () => {
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

  describe('Success Cases - Company Name', () => {
    it('should update HR company name', async () => {
      // Arrange - Create user and select HR role
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      const command = new UpdateHRProfileCommand(userId, 'TechCorp Inc.');

      // Act
      await commandBus.execute(command);

      // Assert
      const profile = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });

      expect(profile).toBeDefined();
      expect(profile!.companyName).toBe('TechCorp Inc.');
    });

    it('should replace existing company name with new one', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      // Set initial company name
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, 'Old Company'),
      );

      // Act - Replace with new company
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, 'New Company'),
      );

      // Assert
      const profile = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.companyName).toBe('New Company');
    });

    it('should trim company name whitespace', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      // Act - Company name with whitespace
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, '  TechCorp Inc.  '),
      );

      // Assert
      const profile = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.companyName).toBe('TechCorp Inc.');
    });

    it('should throw error for empty company name', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      // Act & Assert
      await expect(
        commandBus.execute(new UpdateHRProfileCommand(userId, '')),
      ).rejects.toThrow();
      await expect(
        commandBus.execute(new UpdateHRProfileCommand(userId, '   ')),
      ).rejects.toThrow();
    });

    it('should throw error for too long company name', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      const longName = 'A'.repeat(256); // Max is 255

      // Act & Assert
      await expect(
        commandBus.execute(new UpdateHRProfileCommand(userId, longName)),
      ).rejects.toThrow();
      await expect(
        commandBus.execute(new UpdateHRProfileCommand(userId, longName)),
      ).rejects.toThrow('too long');
    });
  });

  describe('Success Cases - Position', () => {
    it('should update HR position', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      const command = new UpdateHRProfileCommand(
        userId,
        undefined,
        'Senior Recruiter',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const profile = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });

      expect(profile).toBeDefined();
      expect(profile!.position).toBe('Senior Recruiter');
    });

    it('should replace existing position with new one', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      // Set initial position
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, undefined, 'Junior Recruiter'),
      );

      // Act - Update to senior
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, undefined, 'Senior Recruiter'),
      );

      // Assert
      const profile = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.position).toBe('Senior Recruiter');
    });

    it('should trim position whitespace', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      // Act - Position with whitespace
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, undefined, '  HR Manager  '),
      );

      // Assert
      const profile = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.position).toBe('HR Manager');
    });

    it('should throw error for empty position', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      // Act & Assert
      await expect(
        commandBus.execute(new UpdateHRProfileCommand(userId, undefined, '')),
      ).rejects.toThrow();
      await expect(
        commandBus.execute(new UpdateHRProfileCommand(userId, undefined, '   ')),
      ).rejects.toThrow();
    });

    it('should throw error for too long position', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      const longPosition = 'A'.repeat(256); // Max is 255

      // Act & Assert
      await expect(
        commandBus.execute(
          new UpdateHRProfileCommand(userId, undefined, longPosition),
        ),
      ).rejects.toThrow();
      await expect(
        commandBus.execute(
          new UpdateHRProfileCommand(userId, undefined, longPosition),
        ),
      ).rejects.toThrow('too long');
    });
  });

  describe('Success Cases - Combined Updates', () => {
    it('should update both company name and position', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      const command = new UpdateHRProfileCommand(
        userId,
        'TechCorp',
        'HR Director',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const profile = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.companyName).toBe('TechCorp');
      expect(profile!.position).toBe('HR Director');
    });

    it('should update only company name when position not provided', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      // Set initial position
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, undefined, 'Recruiter'),
      );

      // Act - Update only company
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, 'NewCorp', undefined),
      );

      // Assert
      const profile = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.companyName).toBe('NewCorp');
      expect(profile!.position).toBe('Recruiter'); // Unchanged
    });

    it('should update only position when company name not provided', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      // Set initial company
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, 'TechCorp'),
      );

      // Act - Update only position
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, undefined, 'Senior HR Manager'),
      );

      // Assert
      const profile = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.companyName).toBe('TechCorp'); // Unchanged
      expect(profile!.position).toBe('Senior HR Manager');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when HR profile not found', async () => {
      // Arrange - User without HR role
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Candidate',
        lastName: 'User',
        role: 'candidate',
      });

      const command = new UpdateHRProfileCommand(userId, 'Company');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow('not found');
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      const nonExistentUserId = uuidv4();
      const command = new UpdateHRProfileCommand(nonExistentUserId, 'Company');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error when user has not selected HR role', async () => {
      // Arrange - Pending user without role
      const userId = await seedUser(dataSource, {
        email: 'pending@example.com',
        firstName: 'Pending',
        lastName: 'User',
        role: 'pending',
      });

      const command = new UpdateHRProfileCommand(userId, 'Company');

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });
  });

  describe('Business Rules', () => {
    it('should update updatedAt timestamp', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      const profileBefore = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });
      const updatedAtBefore = profileBefore!.updatedAt;

      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, 'NewCompany'),
      );

      // Assert
      const profileAfter = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });

      expect(profileAfter!.updatedAt.getTime()).toBeGreaterThan(
        updatedAtBefore.getTime(),
      );
    });

    it('should not affect other HR profiles', async () => {
      // Arrange - Two HR users
      const user1Id = await seedUser(dataSource, {
        email: 'hr1@example.com',
        firstName: 'HR',
        lastName: 'One',
        role: 'pending',
      });

      const user2Id = await seedUser(dataSource, {
        email: 'hr2@example.com',
        firstName: 'HR',
        lastName: 'Two',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(user1Id, 'hr'));
      await commandBus.execute(new SelectRoleCommand(user2Id, 'hr'));

      // Set initial data for both
      await commandBus.execute(
        new UpdateHRProfileCommand(user1Id, 'Company A', 'Manager A'),
      );
      await commandBus.execute(
        new UpdateHRProfileCommand(user2Id, 'Company B', 'Manager B'),
      );

      // Act - Update only user1
      await commandBus.execute(
        new UpdateHRProfileCommand(user1Id, 'Company C', 'Manager C'),
      );

      // Assert - User2 unchanged
      const profile1 = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId: user1Id } });
      const profile2 = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId: user2Id } });

      expect(profile1!.companyName).toBe('Company C');
      expect(profile1!.position).toBe('Manager C');

      expect(profile2!.companyName).toBe('Company B');
      expect(profile2!.position).toBe('Manager B');
    });

    it('should handle various company name formats', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      const validNames = [
        'TechCorp',
        'Tech-Corp Inc.',
        'Tech Corp & Associates',
        'Tech.Corp',
        '123 Technologies',
        'ТехКомпания', // Cyrillic
      ];

      // Act & Assert
      for (const name of validNames) {
        await commandBus.execute(new UpdateHRProfileCommand(userId, name));

        const profile = await dataSource
          .getRepository(HRProfileEntity)
          .findOne({ where: { userId } });

        expect(profile!.companyName).toBe(name);
      }
    });
  });

  describe('Multiple Operations', () => {
    it('should handle multiple sequential updates', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      // Act - Multiple updates
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, 'Company 1', 'Position 1'),
      );
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, 'Company 2', 'Position 2'),
      );
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, 'Company 3', 'Position 3'),
      );

      // Assert - Final state
      const profile = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.companyName).toBe('Company 3');
      expect(profile!.position).toBe('Position 3');
    });

    it('should handle long but valid company name and position', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'hr'));

      const longCompany = 'A'.repeat(255); // Exactly max length
      const longPosition = 'B'.repeat(255); // Exactly max length

      // Act
      await commandBus.execute(
        new UpdateHRProfileCommand(userId, longCompany, longPosition),
      );

      // Assert
      const profile = await dataSource
        .getRepository(HRProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.companyName).toBe(longCompany);
      expect(profile!.position).toBe(longPosition);
    });
  });
});
