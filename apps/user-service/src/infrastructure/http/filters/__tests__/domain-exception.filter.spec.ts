import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { DomainExceptionFilter } from '../domain-exception.filter';
import { DomainException } from '../../../../domain/exceptions/domain.exception';
import {
  UserNotFoundException,
  UserAlreadyExistsException,
  UserSuspendedException,
  UserDeletedException,
  InvalidUserOperationException,
} from '../../../../domain/exceptions/user.exceptions';
import {
  CompanyNotFoundException,
  CompanyAccessDeniedException,
} from '../../../../domain/exceptions/company.exceptions';

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  function createMockHost(url = '/test', method = 'GET'): ArgumentsHost {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    return {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url, method }),
      }),
    } as unknown as ArgumentsHost;
  }

  beforeEach(() => {
    filter = new DomainExceptionFilter();
  });

  it('should map DomainException to 400 Bad Request', () => {
    const exception = new DomainException('Some business rule violated');
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
      }),
    );
  });

  it('should map UserNotFoundException to 404 Not Found', () => {
    const exception = new UserNotFoundException('user-123');
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      }),
    );
  });

  it('should map CompanyNotFoundException to 404 Not Found', () => {
    const exception = new CompanyNotFoundException('company-456');
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      }),
    );
  });

  it('should map CompanyAccessDeniedException to 403 Forbidden', () => {
    const exception = new CompanyAccessDeniedException();
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
      }),
    );
  });

  it('should include exception message in response', () => {
    const exception = new UserNotFoundException('user-789');
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'User not found: user-789',
      }),
    );
  });

  it('should include request path in response', () => {
    const exception = new DomainException('Something failed');
    const host = createMockHost('/api/users/123');

    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/users/123',
      }),
    );
  });

  it('should include timestamp in response', () => {
    const exception = new DomainException('Something failed');
    const host = createMockHost();

    const before = new Date().toISOString();
    filter.catch(exception, host);
    const after = new Date().toISOString();

    const responseBody = mockJson.mock.calls[0][0];
    expect(responseBody.timestamp).toBeDefined();
    expect(typeof responseBody.timestamp).toBe('string');
    expect(responseBody.timestamp >= before).toBe(true);
    expect(responseBody.timestamp <= after).toBe(true);
  });

  it('should map UserAlreadyExistsException to 409 Conflict', () => {
    const exception = new UserAlreadyExistsException('test@example.com');
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
      }),
    );
  });

  it('should map UserSuspendedException to 403 Forbidden', () => {
    const exception = new UserSuspendedException('user-123');
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
      }),
    );
  });

  it('should map UserDeletedException to 410 Gone', () => {
    const exception = new UserDeletedException('user-123');
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.GONE);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.GONE,
        error: 'Gone',
      }),
    );
  });

  it('should map InvalidUserOperationException to 422 Unprocessable Entity', () => {
    const exception = new InvalidUserOperationException('User is already suspended');
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Unprocessable Entity',
      }),
    );
  });
});
