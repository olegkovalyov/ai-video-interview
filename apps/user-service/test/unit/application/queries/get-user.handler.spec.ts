import { Test, TestingModule } from '@nestjs/testing';
import { GetUserHandler } from '../../../../src/application/queries/get-user/get-user.handler';
import { GetUserQuery } from '../../../../src/application/queries/get-user/get-user.query';
import { IUserReadRepository } from '../../../../src/domain/repositories/user-read.repository.interface';
import { User } from '../../../../src/domain/aggregates/user.aggregate';
import { Email } from '../../../../src/domain/value-objects/email.vo';
import { FullName } from '../../../../src/domain/value-objects/full-name.vo';
import { UserStatus } from '../../../../src/domain/value-objects/user-status.vo';
import { UserNotFoundException } from '../../../../src/domain/exceptions/user.exceptions';

describe('GetUserHandler', () => {
  let handler: GetUserHandler;
  let mockRepository: jest.Mocked<IUserReadRepository>;

  beforeEach(async () => {
    // Create mock
    mockRepository = {
      findById: jest.fn(),
      findByExternalAuthId: jest.fn(),
      findByEmail: jest.fn(),
      list: jest.fn(),
      count: jest.fn(),
      countByStatus: jest.fn(),
    };

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserHandler,
        {
          provide: 'IUserReadRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<GetUserHandler>(GetUserHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const userId = 'user-123';
    const query = new GetUserQuery(userId);

    it('should return user if found', async () => {
      // Arrange
      const user = User.reconstitute(
        userId,
        'external-auth-123',
        Email.create('test@example.com'),
        FullName.create('John', 'Doe'),
        UserStatus.active(),
      );
      mockRepository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(user);
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw UserNotFoundException if user not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        UserNotFoundException,
      );
      await expect(handler.execute(query)).rejects.toThrow(userId);
    });
  });
});
