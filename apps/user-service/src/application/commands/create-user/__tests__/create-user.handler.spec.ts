import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CreateUserHandler } from '../create-user.handler';
import { CreateUserCommand } from '../create-user.command';
import { UserCreationService } from '../../../services/user-creation.service';
import { User } from '../../../../domain/aggregates/user.aggregate';
import { Email } from '../../../../domain/value-objects/email.vo';
import { FullName } from '../../../../domain/value-objects/full-name.vo';

/**
 * Handler is a thin CQRS adapter — full use-case logic is covered by
 * `UserCreationService` tests. Here we only verify the command shape is
 * forwarded correctly and the service result is returned verbatim.
 */
describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let mockService: jest.Mocked<Pick<UserCreationService, 'create'>>;

  const command = new CreateUserCommand({
    userId: 'user-123',
    externalAuthId: 'auth-456',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  });

  beforeEach(async () => {
    mockService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserHandler,
        { provide: UserCreationService, useValue: mockService },
      ],
    }).compile();

    handler = module.get<CreateUserHandler>(CreateUserHandler);
  });

  it('should forward command fields to UserCreationService.create', async () => {
    const fakeUser = User.create({
      id: command.userId,
      externalAuthId: command.externalAuthId,
      email: Email.create(command.email),
      fullName: FullName.create(command.firstName, command.lastName),
    });
    mockService.create.mockResolvedValue(fakeUser);

    const result = await handler.execute(command);

    expect(mockService.create).toHaveBeenCalledTimes(1);
    expect(mockService.create).toHaveBeenCalledWith({
      userId: command.userId,
      externalAuthId: command.externalAuthId,
      email: command.email,
      firstName: command.firstName,
      lastName: command.lastName,
    });
    expect(result).toBe(fakeUser);
  });

  it('should propagate errors from the service', async () => {
    const error = new Error('boom');
    mockService.create.mockRejectedValue(error);

    await expect(handler.execute(command)).rejects.toBe(error);
  });
});
