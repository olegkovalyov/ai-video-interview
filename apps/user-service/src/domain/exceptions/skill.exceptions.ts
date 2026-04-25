import { DomainException } from './domain.exception';

/**
 * Skill-specific domain exceptions.
 * Static `code` + `httpStatus` form the API contract — see DomainExceptionFilter.
 */

export class SkillNotFoundException extends DomainException {
  static readonly code = 'SKILL_NOT_FOUND';
  static readonly httpStatus = 404;

  constructor(identifier: string) {
    super(`Skill not found: ${identifier}`);
    this.name = 'SkillNotFoundException';
  }
}

export class SkillAlreadyExistsException extends DomainException {
  static readonly code = 'SKILL_ALREADY_EXISTS';
  static readonly httpStatus = 409;

  constructor(slug: string) {
    super(`Skill with slug "${slug}" already exists`);
    this.name = 'SkillAlreadyExistsException';
  }
}

export class SkillCategoryNotFoundException extends DomainException {
  static readonly code = 'SKILL_CATEGORY_NOT_FOUND';
  static readonly httpStatus = 422;

  constructor(categoryId: string) {
    super(`Skill category not found: ${categoryId}`);
    this.name = 'SkillCategoryNotFoundException';
  }
}

export class SkillNotActiveException extends DomainException {
  static readonly code = 'SKILL_NOT_ACTIVE';
  static readonly httpStatus = 422;

  constructor(skillName: string) {
    super(`Skill "${skillName}" is not active and cannot be added`);
    this.name = 'SkillNotActiveException';
  }
}
