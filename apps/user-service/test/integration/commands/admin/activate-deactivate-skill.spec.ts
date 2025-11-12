import { INestApplication } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
} from '../../setup';
import { CreateSkillCommand } from '../../../../src/application/commands/admin/create-skill/create-skill.command';
import { ActivateSkillCommand } from '../../../../src/application/commands/admin/activate-skill/activate-skill.command';
import { DeactivateSkillCommand } from '../../../../src/application/commands/admin/deactivate-skill/deactivate-skill.command';

describe('ActivateSkillCommand & DeactivateSkillCommand Integration', () => {
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

  describe('DeactivateSkillCommand', () => {
    it('should deactivate active skill', async () => {
      // Arrange - Create skill (active by default)
      const createCommand = new CreateSkillCommand(
        'Test Skill',
        'test-skill',
        null,
        null,
      );
      const { skillId } = await commandBus.execute(createCommand);

      // Verify skill is active
      const beforeDeactivate = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(beforeDeactivate[0].is_active).toBe(true);

      // Act - Deactivate
      const adminId = uuidv4();
      const deactivateCommand = new DeactivateSkillCommand(skillId, adminId);
      await commandBus.execute(deactivateCommand);

      // Assert - Skill deactivated
      const afterDeactivate = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(afterDeactivate[0].is_active).toBe(false);
    });

    it('should deactivate already deactivated skill (idempotent)', async () => {
      // Arrange - Create and deactivate skill
      const createCommand = new CreateSkillCommand(
        'Test Skill',
        'test-skill',
        null,
        null,
      );
      const { skillId } = await commandBus.execute(createCommand);

      const adminId = uuidv4();
      const deactivateCommand1 = new DeactivateSkillCommand(skillId, adminId);
      await commandBus.execute(deactivateCommand1);

      // Verify skill is deactivated
      const beforeSecondDeactivate = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(beforeSecondDeactivate[0].is_active).toBe(false);

      // Act - Deactivate again
      const deactivateCommand2 = new DeactivateSkillCommand(skillId, adminId);
      await commandBus.execute(deactivateCommand2);

      // Assert - Still deactivated (no error)
      const afterSecondDeactivate = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(afterSecondDeactivate[0].is_active).toBe(false);
    });

    it('should throw error when skill not found', async () => {
      // Arrange
      const nonExistentId = uuidv4();
      const adminId = uuidv4();
      const deactivateCommand = new DeactivateSkillCommand(nonExistentId, adminId);

      // Act & Assert
      await expect(commandBus.execute(deactivateCommand)).rejects.toThrow();
    });

    it('should deactivate multiple skills', async () => {
      // Arrange - Create 3 skills
      const command1 = new CreateSkillCommand('Skill 1', 'skill-1', null, null);
      const { skillId: id1 } = await commandBus.execute(command1);

      const command2 = new CreateSkillCommand('Skill 2', 'skill-2', null, null);
      const { skillId: id2 } = await commandBus.execute(command2);

      const command3 = new CreateSkillCommand('Skill 3', 'skill-3', null, null);
      const { skillId: id3 } = await commandBus.execute(command3);

      // Act - Deactivate all 3
      const adminId = uuidv4();
      await commandBus.execute(new DeactivateSkillCommand(id1, adminId));
      await commandBus.execute(new DeactivateSkillCommand(id2, adminId));
      await commandBus.execute(new DeactivateSkillCommand(id3, adminId));

      // Assert - All deactivated
      const deactivated = await dataSource.query(
        'SELECT id, is_active FROM skills WHERE id = ANY($1)',
        [[id1, id2, id3]],
      );

      expect(deactivated.length).toBe(3);
      deactivated.forEach((skill: any) => {
        expect(skill.is_active).toBe(false);
      });
    });
  });

  describe('ActivateSkillCommand', () => {
    it('should activate deactivated skill', async () => {
      // Arrange - Create and deactivate skill
      const createCommand = new CreateSkillCommand(
        'Test Skill',
        'test-skill',
        null,
        null,
      );
      const { skillId } = await commandBus.execute(createCommand);

      const adminId = uuidv4();
      const deactivateCommand = new DeactivateSkillCommand(skillId, adminId);
      await commandBus.execute(deactivateCommand);

      // Verify skill is deactivated
      const beforeActivate = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(beforeActivate[0].is_active).toBe(false);

      // Act - Activate
      const activateCommand = new ActivateSkillCommand(skillId, adminId);
      await commandBus.execute(activateCommand);

      // Assert - Skill activated
      const afterActivate = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(afterActivate[0].is_active).toBe(true);
    });

    it('should activate already active skill (idempotent)', async () => {
      // Arrange - Create skill (active by default)
      const createCommand = new CreateSkillCommand(
        'Test Skill',
        'test-skill',
        null,
        null,
      );
      const { skillId } = await commandBus.execute(createCommand);

      // Verify skill is active
      const beforeActivate = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(beforeActivate[0].is_active).toBe(true);

      // Act - Activate again
      const adminId = uuidv4();
      const activateCommand = new ActivateSkillCommand(skillId, adminId);
      await commandBus.execute(activateCommand);

      // Assert - Still active (no error)
      const afterActivate = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(afterActivate[0].is_active).toBe(true);
    });

    it('should throw error when skill not found', async () => {
      // Arrange
      const nonExistentId = uuidv4();
      const adminId = uuidv4();
      const activateCommand = new ActivateSkillCommand(nonExistentId, adminId);

      // Act & Assert
      await expect(commandBus.execute(activateCommand)).rejects.toThrow();
    });
  });

  describe('Toggle Workflow', () => {
    it('should toggle skill status multiple times', async () => {
      // Arrange - Create skill
      const createCommand = new CreateSkillCommand(
        'Toggle Skill',
        'toggle-skill',
        null,
        null,
      );
      const { skillId } = await commandBus.execute(createCommand);
      const adminId = uuidv4();

      // Initially active
      let status = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(status[0].is_active).toBe(true);

      // Act 1: Deactivate
      await commandBus.execute(new DeactivateSkillCommand(skillId, adminId));
      status = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(status[0].is_active).toBe(false);

      // Act 2: Activate
      await commandBus.execute(new ActivateSkillCommand(skillId, adminId));
      status = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(status[0].is_active).toBe(true);

      // Act 3: Deactivate again
      await commandBus.execute(new DeactivateSkillCommand(skillId, adminId));
      status = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(status[0].is_active).toBe(false);

      // Act 4: Activate again
      await commandBus.execute(new ActivateSkillCommand(skillId, adminId));
      status = await dataSource.query(
        'SELECT is_active FROM skills WHERE id = $1',
        [skillId],
      );
      expect(status[0].is_active).toBe(true);
    });
  });
});
