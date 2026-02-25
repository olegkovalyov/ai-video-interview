import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalServiceGuard } from '../internal-service.guard';

describe('InternalServiceGuard', () => {
  let guard: InternalServiceGuard;
  let mockConfigService: { get: jest.Mock };

  function createMockContext(headers: Record<string, string> = {}): ExecutionContext {
    const mockRequest = { headers };
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('valid-token'),
    };
    guard = new InternalServiceGuard(mockConfigService as unknown as ConfigService);
  });

  it('should allow request with valid internal token', () => {
    const context = createMockContext({ 'x-internal-token': 'valid-token' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException when token is missing', () => {
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Invalid internal service token');
  });

  it('should throw UnauthorizedException when token is invalid', () => {
    const context = createMockContext({ 'x-internal-token': 'wrong-token' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Invalid internal service token');
  });

  it('should use INTERNAL_SERVICE_TOKEN from ConfigService', () => {
    expect(mockConfigService.get).toHaveBeenCalledWith(
      'INTERNAL_SERVICE_TOKEN',
      'internal-secret',
    );
  });

  it('should default to "internal-secret" when config not set', () => {
    const defaultConfigService = {
      get: jest.fn().mockReturnValue('internal-secret'),
    };
    const defaultGuard = new InternalServiceGuard(
      defaultConfigService as unknown as ConfigService,
    );

    const context = createMockContext({ 'x-internal-token': 'internal-secret' });

    const result = defaultGuard.canActivate(context);

    expect(result).toBe(true);
    expect(defaultConfigService.get).toHaveBeenCalledWith(
      'INTERNAL_SERVICE_TOKEN',
      'internal-secret',
    );
  });
});
