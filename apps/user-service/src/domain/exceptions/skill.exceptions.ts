import { DomainException } from './domain.exception';

export class SkillNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`Skill not found: ${identifier}`);
    this.name = 'SkillNotFoundException';
  }
}

export class SkillAlreadyExistsException extends DomainException {
  constructor(slug: string) {
    super(`Skill with slug "${slug}" already exists`);
    this.name = 'SkillAlreadyExistsException';
  }
}

export class SkillCategoryNotFoundException extends DomainException {
  constructor(categoryId: string) {
    super(`Skill category not found: ${categoryId}`);
    this.name = 'SkillCategoryNotFoundException';
  }
}

export class SkillNotActiveException extends DomainException {
  constructor(skillName: string) {
    super(`Skill "${skillName}" is not active and cannot be added`);
    this.name = 'SkillNotActiveException';
  }
}
