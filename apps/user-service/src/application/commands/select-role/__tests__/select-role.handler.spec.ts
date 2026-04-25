import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { SelectRoleHandler } from '../select-role.handler';
import { SelectRoleCommand } from '../select-role.command';
import { RoleSelectionService } from '../../../services/role-selection.service';

/**
 * Handler is a thin CQRS adapter — full use-case logic is covered by
 * `RoleSelectionService` tests. Here we only verify the command shape is
 * forwarded correctly and errors propagate verbatim.
 */
describe('SelectRoleHandler', () => {
  let handler: SelectRoleHandler;
  let mockService: jest.Mocked<Pick<RoleSelectionService, 'select'>>;

  const command = new SelectRoleCommand('user-id-1', 'candidate');

  beforeEach(async () => {
    mockService = { select: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SelectRoleHandler,
        { provide: RoleSelectionService, useValue: mockService },
      ],
    }).compile();

    handler = module.get<SelectRoleHandler>(SelectRoleHandler);
  });

  it('should forward command fields to RoleSelectionService.select', async () => {
    mockService.select.mockResolvedValue(undefined);

    await handler.execute(command);

    expect(mockService.select).toHaveBeenCalledTimes(1);
    expect(mockService.select).toHaveBeenCalledWith({
      userId: command.userId,
      role: command.role,
    });
  });

  it('should propagate errors from the service', async () => {
    const error = new Error('boom');
    mockService.select.mockRejectedValue(error);

    await expect(handler.execute(command)).rejects.toBe(error);
  });
});
