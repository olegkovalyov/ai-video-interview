import { UpdateUserHandler } from '../update-user.handler';
import { UpdateUserCommand } from '../update-user.command';
import type { UserUpdateService } from '../../../services/user-update.service';

describe('UpdateUserHandler (thin CQRS adapter)', () => {
  let userUpdate: jest.Mocked<Pick<UserUpdateService, 'update'>>;
  let handler: UpdateUserHandler;

  beforeEach(() => {
    userUpdate = { update: jest.fn() };
    handler = new UpdateUserHandler(userUpdate as unknown as UserUpdateService);
  });

  it('forwards command fields to UserUpdateService.update', async () => {
    userUpdate.update.mockResolvedValue({} as any);

    const command = new UpdateUserCommand({
      userId: 'user-123',
      firstName: 'Jane',
      lastName: 'Smith',
      bio: 'b',
      phone: 'p',
      timezone: 't',
      language: 'l',
    });

    await handler.execute(command);

    expect(userUpdate.update).toHaveBeenCalledTimes(1);
    expect(userUpdate.update).toHaveBeenCalledWith({
      userId: 'user-123',
      firstName: 'Jane',
      lastName: 'Smith',
      bio: 'b',
      phone: 'p',
      timezone: 't',
      language: 'l',
    });
  });

  it('propagates errors thrown by the service', async () => {
    const failure = new Error('boom');
    userUpdate.update.mockRejectedValue(failure);

    await expect(
      handler.execute(new UpdateUserCommand({ userId: 'u' })),
    ).rejects.toThrow(failure);
  });
});
