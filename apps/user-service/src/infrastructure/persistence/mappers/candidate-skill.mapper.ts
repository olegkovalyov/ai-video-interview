import { Injectable } from '@nestjs/common';
import { CandidateSkill } from '../../../domain/entities/candidate-skill.entity';
import { CandidateSkillEntity } from '../entities/candidate-skill.entity';
import { ProficiencyLevel } from '../../../domain/value-objects/proficiency-level.vo';
import { YearsOfExperience } from '../../../domain/value-objects/years-of-experience.vo';

@Injectable()
export class CandidateSkillMapper {
  toEntity(skill: CandidateSkill): CandidateSkillEntity {
    const entity = new CandidateSkillEntity();

    entity.id = skill.id;
    entity.candidateId = skill.candidateId;
    entity.skillId = skill.skillId;
    entity.description = skill.description;
    entity.proficiencyLevel =
      (skill.proficiencyLevel
        ?.value as CandidateSkillEntity['proficiencyLevel']) ?? null;
    entity.yearsOfExperience = skill.yearsOfExperience
      ? skill.yearsOfExperience.value
      : null;
    entity.createdAt = skill.createdAt;
    entity.updatedAt = skill.updatedAt;

    return entity;
  }

  toDomain(entity: CandidateSkillEntity): CandidateSkill {
    const proficiency = entity.proficiencyLevel
      ? ProficiencyLevel.fromString(entity.proficiencyLevel)
      : null;
    const years =
      entity.yearsOfExperience === null
        ? null
        : YearsOfExperience.fromNumber(entity.yearsOfExperience);

    return CandidateSkill.reconstitute({
      id: entity.id,
      candidateId: entity.candidateId,
      skillId: entity.skillId,
      description: entity.description,
      proficiencyLevel: proficiency,
      yearsOfExperience: years,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  toDomainList(entities: CandidateSkillEntity[]): CandidateSkill[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
