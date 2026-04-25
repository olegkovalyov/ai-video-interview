import type { ArgumentsHost } from '@nestjs/common';
import { Logger } from '@nestjs/common';

// Suppress Logger.warn output from filter (tested behavior, not debug info)
jest.spyOn(Logger.prototype, 'warn').mockImplementation();
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
  CompanyAlreadyExistsException,
  InvalidCompanySizeException,
} from '../../../../domain/exceptions/company.exceptions';
import {
  SkillNotFoundException,
  SkillAlreadyExistsException,
  SkillCategoryNotFoundException,
  SkillNotActiveException,
} from '../../../../domain/exceptions/skill.exceptions';
import {
  CandidateProfileNotFoundException,
  CandidateSkillAlreadyExistsException,
  CandidateSkillNotFoundException,
  InvalidExperienceLevelException,
} from '../../../../domain/exceptions/candidate.exceptions';
import { AccessDeniedException } from '../../../../domain/exceptions/access-denied.exception';

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

  describe('response contract', () => {
    it('should always set success: false', () => {
      filter.catch(new UserNotFoundException('u'), createMockHost());

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });

    it('should expose exception message under "error"', () => {
      filter.catch(new UserNotFoundException('user-789'), createMockHost());

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'User not found: user-789' }),
      );
    });

    it('should include request path', () => {
      filter.catch(
        new DomainException('Something failed'),
        createMockHost('/api/users/123'),
      );

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/users/123' }),
      );
    });

    it('should include ISO timestamp', () => {
      const before = new Date().toISOString();
      filter.catch(new DomainException('Something failed'), createMockHost());
      const after = new Date().toISOString();

      const body = mockJson.mock.calls[0][0];
      expect(typeof body.timestamp).toBe('string');
      expect(body.timestamp >= before).toBe(true);
      expect(body.timestamp <= after).toBe(true);
    });
  });

  describe('status + code mapping (read from static fields)', () => {
    type ExceptionFactory = () => DomainException;

    const cases: ReadonlyArray<{
      name: string;
      factory: ExceptionFactory;
      status: number;
      code: string;
    }> = [
      {
        name: 'DomainException (base)',
        factory: () => new DomainException('boom'),
        status: 400,
        code: 'DOMAIN_ERROR',
      },
      {
        name: 'UserNotFoundException',
        factory: () => new UserNotFoundException('user-123'),
        status: 404,
        code: 'USER_NOT_FOUND',
      },
      {
        name: 'UserAlreadyExistsException',
        factory: () => new UserAlreadyExistsException('test@example.com'),
        status: 409,
        code: 'USER_ALREADY_EXISTS',
      },
      {
        name: 'UserSuspendedException',
        factory: () => new UserSuspendedException('user-123'),
        status: 403,
        code: 'USER_SUSPENDED',
      },
      {
        name: 'UserDeletedException',
        factory: () => new UserDeletedException('user-123'),
        status: 410,
        code: 'USER_DELETED',
      },
      {
        name: 'InvalidUserOperationException',
        factory: () => new InvalidUserOperationException('cannot transition'),
        status: 422,
        code: 'INVALID_USER_OPERATION',
      },
      {
        name: 'CompanyNotFoundException',
        factory: () => new CompanyNotFoundException('company-456'),
        status: 404,
        code: 'COMPANY_NOT_FOUND',
      },
      {
        name: 'CompanyAccessDeniedException',
        factory: () => new CompanyAccessDeniedException(),
        status: 403,
        code: 'COMPANY_ACCESS_DENIED',
      },
      {
        name: 'CompanyAlreadyExistsException',
        factory: () => new CompanyAlreadyExistsException('Acme'),
        status: 409,
        code: 'COMPANY_ALREADY_EXISTS',
      },
      {
        name: 'InvalidCompanySizeException',
        factory: () =>
          new InvalidCompanySizeException('999', ['1-10', '11-50']),
        status: 400,
        code: 'INVALID_COMPANY_SIZE',
      },
      {
        name: 'SkillNotFoundException',
        factory: () => new SkillNotFoundException('skill-1'),
        status: 404,
        code: 'SKILL_NOT_FOUND',
      },
      {
        name: 'SkillAlreadyExistsException',
        factory: () => new SkillAlreadyExistsException('javascript'),
        status: 409,
        code: 'SKILL_ALREADY_EXISTS',
      },
      {
        name: 'SkillCategoryNotFoundException',
        factory: () => new SkillCategoryNotFoundException('cat-1'),
        status: 422,
        code: 'SKILL_CATEGORY_NOT_FOUND',
      },
      {
        name: 'SkillNotActiveException',
        factory: () => new SkillNotActiveException('Java'),
        status: 422,
        code: 'SKILL_NOT_ACTIVE',
      },
      {
        name: 'CandidateProfileNotFoundException',
        factory: () => new CandidateProfileNotFoundException('user-123'),
        status: 404,
        code: 'CANDIDATE_PROFILE_NOT_FOUND',
      },
      {
        name: 'CandidateSkillAlreadyExistsException',
        factory: () => new CandidateSkillAlreadyExistsException('TypeScript'),
        status: 409,
        code: 'CANDIDATE_SKILL_ALREADY_EXISTS',
      },
      {
        name: 'CandidateSkillNotFoundException',
        factory: () => new CandidateSkillNotFoundException('skill-1'),
        status: 404,
        code: 'CANDIDATE_SKILL_NOT_FOUND',
      },
      {
        name: 'InvalidExperienceLevelException',
        factory: () =>
          new InvalidExperienceLevelException('expert', ['junior', 'mid']),
        status: 400,
        code: 'INVALID_EXPERIENCE_LEVEL',
      },
      {
        name: 'AccessDeniedException',
        factory: () => new AccessDeniedException(),
        status: 403,
        code: 'ACCESS_DENIED',
      },
    ];

    it.each(cases)(
      '$name → $status with code $code',
      ({ factory, status, code }) => {
        filter.catch(factory(), createMockHost());

        expect(mockStatus).toHaveBeenCalledWith(status);
        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({ code }),
        );
      },
    );
  });
});
