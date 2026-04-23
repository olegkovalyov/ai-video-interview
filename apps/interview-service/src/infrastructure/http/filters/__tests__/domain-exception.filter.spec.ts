import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { DomainExceptionFilter } from '../domain-exception.filter';
import {
  DomainException,
  TemplateNotFoundException,
  QuestionNotFoundException,
  TemplateUnauthorizedException,
  TemplateAlreadyPublishedException,
  DuplicateQuestionOrderException,
  InvalidTemplateStateException,
  TemplateArchivedException,
} from '../../../../domain/exceptions/interview-template.exceptions';
import {
  InvitationNotFoundException,
  InvitationAccessDeniedException,
  InvitationExpiredException,
  DuplicateInvitationException,
  DuplicateResponseException,
  InvalidInvitationStateException,
  InvitationIncompleteException,
} from '../../../../domain/exceptions/invitation.exceptions';
import { QuotaExceededException } from '../../../../domain/exceptions/quota.exceptions';

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

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
    jest.clearAllMocks();
    filter = new DomainExceptionFilter(mockLogger as any);
  });

  // --- 404 Not Found ---

  it('should map TemplateNotFoundException to 404 Not Found', () => {
    const exception = new TemplateNotFoundException('tmpl-123');
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

  it('should map QuestionNotFoundException to 404 Not Found', () => {
    const exception = new QuestionNotFoundException('q-456');
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

  it('should map InvitationNotFoundException to 404 Not Found', () => {
    const exception = new InvitationNotFoundException('inv-789');
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

  // --- 403 Forbidden ---

  it('should map TemplateUnauthorizedException to 403 Forbidden', () => {
    const exception = new TemplateUnauthorizedException('user-1', 'tmpl-1');
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

  it('should map InvitationAccessDeniedException to 403 Forbidden', () => {
    const exception = new InvitationAccessDeniedException('Access denied');
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

  // --- 409 Conflict ---

  it('should map DuplicateInvitationException to 409 Conflict', () => {
    const exception = new DuplicateInvitationException('cand-1', 'tmpl-1');
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

  it('should map DuplicateResponseException to 409 Conflict', () => {
    const exception = new DuplicateResponseException('q-1');
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

  it('should map DuplicateQuestionOrderException to 409 Conflict', () => {
    const exception = new DuplicateQuestionOrderException(3);
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

  it('should map TemplateAlreadyPublishedException to 409 Conflict', () => {
    const exception = new TemplateAlreadyPublishedException('tmpl-1');
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

  // --- 422 Unprocessable Entity ---

  it('should map InvalidInvitationStateException to 422 Unprocessable Entity', () => {
    const exception = new InvalidInvitationStateException('start', 'completed');
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

  it('should map InvalidTemplateStateException to 422 Unprocessable Entity', () => {
    const exception = new InvalidTemplateStateException('publish', 'archived');
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

  it('should map TemplateArchivedException to 422 Unprocessable Entity', () => {
    const exception = new TemplateArchivedException('tmpl-1');
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

  it('should map InvitationIncompleteException to 422 Unprocessable Entity', () => {
    const exception = new InvitationIncompleteException(3, 5);
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

  // --- 402 Payment Required ---

  it('should map QuotaExceededException to 402 Payment Required', () => {
    const exception = new QuotaExceededException('interviews', 'free', 3);
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.PAYMENT_REQUIRED);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: 'Payment Required',
        message: expect.stringContaining('Quota exceeded'),
      }),
    );
  });

  // --- 410 Gone ---

  it('should map InvitationExpiredException to 410 Gone', () => {
    const exception = new InvitationExpiredException('inv-1');
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

  // --- 400 Bad Request (default) ---

  it('should map base DomainException to 400 Bad Request', () => {
    // DomainException is abstract, so we create a concrete subclass for testing
    class TestDomainException extends DomainException {
      constructor(message: string) {
        super(message);
      }
    }
    const exception = new TestDomainException('Some business rule violated');
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

  // --- Response format ---

  it('should include exception message in response', () => {
    const exception = new TemplateNotFoundException('tmpl-789');
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Interview template with id tmpl-789 not found',
      }),
    );
  });

  it('should include request path in response', () => {
    class TestDomainException extends DomainException {
      constructor(message: string) {
        super(message);
      }
    }
    const exception = new TestDomainException('Something failed');
    const host = createMockHost('/api/interviews/templates/123');

    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/interviews/templates/123',
      }),
    );
  });

  it('should include timestamp in response', () => {
    class TestDomainException extends DomainException {
      constructor(message: string) {
        super(message);
      }
    }
    const exception = new TestDomainException('Something failed');
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

  it('should log a warning with exception details', () => {
    const exception = new InvitationNotFoundException('inv-1');
    const host = createMockHost('/api/invitations/inv-1', 'GET');

    filter.catch(exception, host);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('InvitationNotFoundException'),
    );
  });
});
