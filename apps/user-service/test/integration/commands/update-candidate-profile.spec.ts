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
import { UpdateCandidateProfileCommand } from '../../../src/application/commands/update-candidate-profile/update-candidate-profile.command';
import { SelectRoleCommand } from '../../../src/application/commands/select-role/select-role.command';
import { CandidateProfileEntity } from '../../../src/infrastructure/persistence/entities/candidate-profile.entity';

describe('UpdateCandidateProfileCommand Integration', () => {
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

  describe('Success Cases - Skills', () => {
    it('should update candidate skills', async () => {
      // Arrange - Create user and select candidate role
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      const skills = ['JavaScript', 'TypeScript', 'React', 'Node.js'];
      const command = new UpdateCandidateProfileCommand(userId, skills);

      // Act
      await commandBus.execute(command);

      // Assert
      const profile = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profile).toBeDefined();
      expect(profile!.skills).toEqual(skills);
    });

    it('should replace existing skills with new ones', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      // Set initial skills
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, ['Old Skill 1', 'Old Skill 2']),
      );

      // Act - Replace with new skills
      const newSkills = ['New Skill 1', 'New Skill 2', 'New Skill 3'];
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, newSkills),
      );

      // Assert
      const profile = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.skills).toEqual(newSkills);
      expect(profile!.skills).not.toContain('Old Skill 1');
    });

    it('should handle empty skills array', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      // Set initial skills
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, ['Skill 1', 'Skill 2']),
      );

      // Act - Clear skills
      await commandBus.execute(new UpdateCandidateProfileCommand(userId, []));

      // Assert
      const profile = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.skills).toEqual([]);
    });

    it('should remove duplicate skills case-insensitively', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      // Act - Duplicate skills with different cases
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, [
          'JavaScript',
          'javascript',
          'JAVASCRIPT',
          'TypeScript',
        ]),
      );

      // Assert
      const profile = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.skills).toHaveLength(2);
      expect(profile!.skills).toContain('JavaScript');
      expect(profile!.skills).toContain('TypeScript');
    });

    it('should trim and clean skills', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      // Act - Skills with whitespace
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, [
          '  JavaScript  ',
          'TypeScript',
          '   ',
          'React',
        ]),
      );

      // Assert
      const profile = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.skills).toEqual(['JavaScript', 'TypeScript', 'React']);
    });
  });

  describe('Success Cases - Experience Level', () => {
    it('should update candidate experience level', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      const command = new UpdateCandidateProfileCommand(
        userId,
        undefined,
        'mid',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const profile = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profile).toBeDefined();
      expect(profile!.experienceLevel).toBe('mid');
    });

    it('should update experience level to all valid values', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      const levels: Array<'junior' | 'mid' | 'senior' | 'lead'> = [
        'junior',
        'mid',
        'senior',
        'lead',
      ];

      // Act & Assert each level
      for (const level of levels) {
        await commandBus.execute(
          new UpdateCandidateProfileCommand(userId, undefined, level),
        );

        const profile = await dataSource
          .getRepository(CandidateProfileEntity)
          .findOne({ where: { userId } });

        expect(profile!.experienceLevel).toBe(level);
      }
    });

    it('should replace existing experience level', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      // Set initial level
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, undefined, 'junior'),
      );

      // Act - Update to senior
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, undefined, 'senior'),
      );

      // Assert
      const profile = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.experienceLevel).toBe('senior');
    });
  });

  describe('Success Cases - Combined Updates', () => {
    it('should update both skills and experience level', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      const skills = ['Python', 'Django', 'PostgreSQL'];
      const command = new UpdateCandidateProfileCommand(
        userId,
        skills,
        'senior',
      );

      // Act
      await commandBus.execute(command);

      // Assert
      const profile = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.skills).toEqual(skills);
      expect(profile!.experienceLevel).toBe('senior');
    });

    it('should update only skills when experience level not provided', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      // Set initial experience level
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, undefined, 'mid'),
      );

      // Act - Update only skills
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, ['Skill 1'], undefined),
      );

      // Assert
      const profile = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.skills).toEqual(['Skill 1']);
      expect(profile!.experienceLevel).toBe('mid'); // Unchanged
    });

    it('should update only experience level when skills not provided', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      // Set initial skills
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, ['Skill 1', 'Skill 2']),
      );

      // Act - Update only experience level
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, undefined, 'lead'),
      );

      // Assert
      const profile = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.skills).toEqual(['Skill 1', 'Skill 2']); // Unchanged
      expect(profile!.experienceLevel).toBe('lead');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when candidate profile not found', async () => {
      // Arrange - User without candidate role
      const userId = await seedUser(dataSource, {
        email: 'hr@example.com',
        firstName: 'HR',
        lastName: 'User',
        role: 'hr',
      });

      const command = new UpdateCandidateProfileCommand(userId, ['Skill 1']);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow('not found');
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      const nonExistentUserId = uuidv4();
      const command = new UpdateCandidateProfileCommand(nonExistentUserId, [
        'Skill 1',
      ]);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });

    it('should throw error when user has not selected candidate role', async () => {
      // Arrange - Pending user without role
      const userId = await seedUser(dataSource, {
        email: 'pending@example.com',
        firstName: 'Pending',
        lastName: 'User',
        role: 'pending',
      });

      const command = new UpdateCandidateProfileCommand(userId, ['Skill 1']);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
    });
  });

  describe('Business Rules', () => {
    it('should update updatedAt timestamp', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      const profileBefore = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });
      const updatedAtBefore = profileBefore!.updatedAt;

      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Act
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, ['New Skill']),
      );

      // Assert
      const profileAfter = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profileAfter!.updatedAt.getTime()).toBeGreaterThan(
        updatedAtBefore.getTime(),
      );
    });

    it('should not affect other candidate profiles', async () => {
      // Arrange - Two candidates
      const user1Id = await seedUser(dataSource, {
        email: 'candidate1@example.com',
        firstName: 'Candidate',
        lastName: 'One',
        role: 'pending',
      });

      const user2Id = await seedUser(dataSource, {
        email: 'candidate2@example.com',
        firstName: 'Candidate',
        lastName: 'Two',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(user1Id, 'candidate'));
      await commandBus.execute(new SelectRoleCommand(user2Id, 'candidate'));

      // Set initial data for both
      await commandBus.execute(
        new UpdateCandidateProfileCommand(user1Id, ['Skill A'], 'junior'),
      );
      await commandBus.execute(
        new UpdateCandidateProfileCommand(user2Id, ['Skill B'], 'senior'),
      );

      // Act - Update only user1
      await commandBus.execute(
        new UpdateCandidateProfileCommand(user1Id, ['New Skill'], 'mid'),
      );

      // Assert - User2 unchanged
      const profile1 = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId: user1Id } });
      const profile2 = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId: user2Id } });

      expect(profile1!.skills).toEqual(['New Skill']);
      expect(profile1!.experienceLevel).toBe('mid');

      expect(profile2!.skills).toEqual(['Skill B']);
      expect(profile2!.experienceLevel).toBe('senior');
    });
  });

  describe('Multiple Operations', () => {
    it('should handle multiple sequential updates', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      // Act - Multiple updates
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, ['Skill 1'], 'junior'),
      );
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, ['Skill 1', 'Skill 2'], 'mid'),
      );
      await commandBus.execute(
        new UpdateCandidateProfileCommand(
          userId,
          ['Skill 1', 'Skill 2', 'Skill 3'],
          'senior',
        ),
      );

      // Assert - Final state
      const profile = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.skills).toEqual(['Skill 1', 'Skill 2', 'Skill 3']);
      expect(profile!.experienceLevel).toBe('senior');
    });

    it('should handle many skills', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'candidate@example.com',
        firstName: 'Test',
        lastName: 'Candidate',
        role: 'pending',
      });

      await commandBus.execute(new SelectRoleCommand(userId, 'candidate'));

      const manySkills = Array.from({ length: 20 }, (_, i) => `Skill ${i + 1}`);

      // Act
      await commandBus.execute(
        new UpdateCandidateProfileCommand(userId, manySkills),
      );

      // Assert
      const profile = await dataSource
        .getRepository(CandidateProfileEntity)
        .findOne({ where: { userId } });

      expect(profile!.skills).toHaveLength(20);
    });
  });
});
