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
import { UploadAvatarCommand } from '../../../src/application/commands/upload-avatar/upload-avatar.command';
import { UserEntity } from '../../../src/infrastructure/persistence/entities/user.entity';
import { mockStorageService } from '../test-application.module';

describe('UploadAvatarCommand Integration', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    commandBus = app.get(CommandBus);
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
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

  describe('Success Cases', () => {
    it('should upload avatar for active user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'active',
      });

      const mockFile = {
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
      };

      const command = new UploadAvatarCommand(userId, mockFile);

      // Act
      const result = await commandBus.execute(command);

      // Assert
      expect(result.avatarUrl).toBe(
        'https://storage.example.com/avatars/test-avatar.jpg',
      );
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'user-avatars',
      );

      // Verify in database
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.avatarUrl).toBe(
        'https://storage.example.com/avatars/test-avatar.jpg',
      );
    });

    it('should replace old avatar with new one', async () => {
      // Arrange - User with existing avatar
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'active',
      });

      // Set initial avatar
      await dataSource
        .getRepository(UserEntity)
        .update({ id: userId }, { avatarUrl: 'https://old-avatar.jpg' });

      const mockFile = {
        originalname: 'new-avatar.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('new-image-data'),
      };

      const command = new UploadAvatarCommand(userId, mockFile);

      // Act
      await commandBus.execute(command);

      // Assert - Old avatar should be deleted
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(
        'https://old-avatar.jpg',
      );
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'user-avatars',
      );

      // Verify new avatar URL in database
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.avatarUrl).toBe(
        'https://storage.example.com/avatars/test-avatar.jpg',
      );
    });

    it('should update updatedAt timestamp', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'active',
      });

      const entityBefore = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });
      const updatedAtBefore = entityBefore!.updatedAt;

      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const mockFile = {
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
      };

      // Act
      await commandBus.execute(new UploadAvatarCommand(userId, mockFile));

      // Assert
      const entityAfter = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entityAfter!.updatedAt.getTime()).toBeGreaterThan(
        updatedAtBefore.getTime(),
      );
    });

    it('should handle different file types', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'active',
      });

      const pngFile = {
        originalname: 'avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from('png-data'),
      };

      // Act
      await commandBus.execute(new UploadAvatarCommand(userId, pngFile));

      // Assert
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        pngFile,
        'user-avatars',
      );
    });
  });

  describe('Error Cases', () => {
    it('should throw error when user not found', async () => {
      // Arrange
      const nonExistentUserId = uuidv4();
      const mockFile = {
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
      };

      const command = new UploadAvatarCommand(nonExistentUserId, mockFile);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow('not found');
    });

    it('should throw error when uploading for suspended user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'suspended@example.com',
        firstName: 'Suspended',
        lastName: 'User',
        status: 'suspended',
      });

      const mockFile = {
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
      };

      const command = new UploadAvatarCommand(userId, mockFile);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow('suspended');
    });

    it('should throw error when uploading for deleted user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'deleted@example.com',
        firstName: 'Deleted',
        lastName: 'User',
        status: 'deleted',
      });

      const mockFile = {
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
      };

      const command = new UploadAvatarCommand(userId, mockFile);

      // Act & Assert
      await expect(commandBus.execute(command)).rejects.toThrow();
      await expect(commandBus.execute(command)).rejects.toThrow('deleted');
    });
  });

  describe('Business Rules', () => {
    it('should preserve user data when uploading avatar', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'preserve@example.com',
        firstName: 'Preserve',
        lastName: 'Data',
        status: 'active',
        role: 'candidate',
      });

      const mockFile = {
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
      };

      // Act
      await commandBus.execute(new UploadAvatarCommand(userId, mockFile));

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.email).toBe('preserve@example.com');
      expect(entity!.firstName).toBe('Preserve');
      expect(entity!.lastName).toBe('Data');
      expect(entity!.role).toBe('candidate');
      expect(entity!.status).toBe('active');
    });

    it('should not call deleteFile when user has no existing avatar', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'noavatar@example.com',
        firstName: 'No',
        lastName: 'Avatar',
        status: 'active',
      });

      const mockFile = {
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
      };

      // Act
      await commandBus.execute(new UploadAvatarCommand(userId, mockFile));

      // Assert
      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
      expect(mockStorageService.uploadFile).toHaveBeenCalled();
    });

    it('should handle storage service errors gracefully for old avatar deletion', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'active',
      });

      // Set existing avatar
      await dataSource
        .getRepository(UserEntity)
        .update({ id: userId }, { avatarUrl: 'https://old-avatar.jpg' });

      // Mock deleteFile to fail
      mockStorageService.deleteFile.mockRejectedValueOnce(
        new Error('Storage error'),
      );

      const mockFile = {
        originalname: 'new-avatar.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('new-image-data'),
      };

      // Act - Should not throw despite deleteFile error
      const result = await commandBus.execute(
        new UploadAvatarCommand(userId, mockFile),
      );

      // Assert - Upload should succeed
      expect(result.avatarUrl).toBe(
        'https://storage.example.com/avatars/test-avatar.jpg',
      );
    });
  });

  describe('Multiple Operations', () => {
    it('should allow multiple avatar uploads for same user', async () => {
      // Arrange
      const userId = await seedUser(dataSource, {
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'active',
      });

      const file1 = {
        originalname: 'avatar1.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image1'),
      };

      const file2 = {
        originalname: 'avatar2.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image2'),
      };

      // Act
      await commandBus.execute(new UploadAvatarCommand(userId, file1));

      // Reset mock to return different URL
      mockStorageService.uploadFile.mockResolvedValueOnce(
        'https://storage.example.com/avatars/test-avatar-2.jpg',
      );

      await commandBus.execute(new UploadAvatarCommand(userId, file2));

      // Assert
      const entity = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userId } });

      expect(entity!.avatarUrl).toBe(
        'https://storage.example.com/avatars/test-avatar-2.jpg',
      );
      expect(mockStorageService.uploadFile).toHaveBeenCalledTimes(2);
    });

    it('should handle avatar uploads for multiple users', async () => {
      // Arrange
      const user1Id = await seedUser(dataSource, {
        email: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
        status: 'active',
      });

      const user2Id = await seedUser(dataSource, {
        email: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
        status: 'active',
      });

      const file1 = {
        originalname: 'avatar1.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image1'),
      };

      const file2 = {
        originalname: 'avatar2.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image2'),
      };

      // Act
      await commandBus.execute(new UploadAvatarCommand(user1Id, file1));
      await commandBus.execute(new UploadAvatarCommand(user2Id, file2));

      // Assert
      const user1 = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: user1Id } });
      const user2 = await dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: user2Id } });

      expect(user1!.avatarUrl).toBeDefined();
      expect(user2!.avatarUrl).toBeDefined();
      expect(mockStorageService.uploadFile).toHaveBeenCalledTimes(2);
    });
  });
});
