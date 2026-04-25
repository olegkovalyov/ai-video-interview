/* eslint-disable max-classes-per-file --
 * Domain exception bundle: all exceptions for the Candidate bounded context
 * grouped by topic. See user.exceptions.ts for rationale.
 */
import { DomainException } from './domain.exception';

/**
 * Candidate-specific domain exceptions.
 * Static `code` + `httpStatus` form the API contract — see DomainExceptionFilter.
 */

export class CandidateProfileNotFoundException extends DomainException {
  static readonly code = 'CANDIDATE_PROFILE_NOT_FOUND';
  static readonly httpStatus = 404;

  constructor(userId: string) {
    super(`Candidate profile not found for user: ${userId}`);
    this.name = 'CandidateProfileNotFoundException';
  }
}

export class CandidateSkillAlreadyExistsException extends DomainException {
  static readonly code = 'CANDIDATE_SKILL_ALREADY_EXISTS';
  static readonly httpStatus = 409;

  constructor(skillName: string) {
    super(`Skill "${skillName}" is already in your profile`);
    this.name = 'CandidateSkillAlreadyExistsException';
  }
}

export class CandidateSkillNotFoundException extends DomainException {
  static readonly code = 'CANDIDATE_SKILL_NOT_FOUND';
  static readonly httpStatus = 404;

  constructor(skillId: string) {
    super(`Skill not found in profile: ${skillId}`);
    this.name = 'CandidateSkillNotFoundException';
  }
}

export class InvalidExperienceLevelException extends DomainException {
  static readonly code = 'INVALID_EXPERIENCE_LEVEL';
  static readonly httpStatus = 400;

  constructor(value: string, allowed: readonly string[]) {
    super(
      `Invalid experience level: ${value}. Must be one of: ${allowed.join(', ')}`,
    );
    this.name = 'InvalidExperienceLevelException';
  }
}
