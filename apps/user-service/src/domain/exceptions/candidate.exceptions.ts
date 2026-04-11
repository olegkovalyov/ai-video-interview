import { DomainException } from './domain.exception';

export class CandidateProfileNotFoundException extends DomainException {
  constructor(userId: string) {
    super(`Candidate profile not found for user: ${userId}`);
    this.name = 'CandidateProfileNotFoundException';
  }
}

export class CandidateSkillAlreadyExistsException extends DomainException {
  constructor(skillName: string) {
    super(`Skill "${skillName}" is already in your profile`);
    this.name = 'CandidateSkillAlreadyExistsException';
  }
}
