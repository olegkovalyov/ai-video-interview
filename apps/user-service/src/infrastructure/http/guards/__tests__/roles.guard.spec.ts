import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: { getAllAndOverride: jest.Mock };

  const mockHandler = jest.fn();
  const mockClass = jest.fn();

  function createMockContext(user?: { roles?: string[] }): ExecutionContext {
    const mockRequest = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => mockHandler,
      getClass: () => mockClass,
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(mockReflector as unknown as Reflector);
  });

  it('should allow when no roles required (reflector returns undefined)', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow when no roles required (reflector returns empty array)', () => {
    mockReflector.getAllAndOverride.mockReturnValue([]);
    const context = createMockContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow when user has required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext({ roles: ['admin', 'hr'] });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow when user has one of multiple required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin', 'hr']);
    const context = createMockContext({ roles: ['hr'] });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user not on request', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('User not authenticated');
  });

  it('should throw ForbiddenException when user lacks required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext({ roles: ['candidate'] });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException with descriptive message listing required roles', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin', 'hr']);
    const context = createMockContext({ roles: ['candidate'] });

    expect(() => guard.canActivate(context)).toThrow(
      'User does not have required role(s): admin, hr',
    );
  });

  it('should handle user with empty roles array', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext({ roles: [] });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should call reflector with correct metadata key and targets', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext();

    guard.canActivate(context);

    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
      mockHandler,
      mockClass,
    ]);
  });
});
