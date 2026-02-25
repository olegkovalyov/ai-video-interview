import { v4 as uuidv4 } from 'uuid';
import { CandidateSkillMapper } from '../candidate-skill.mapper';
import { CandidateSkill } from '../../../../domain/entities/candidate-skill.entity';
import { CandidateSkillEntity } from '../../entities/candidate-skill.entity';
import { ProficiencyLevel } from '../../../../domain/value-objects/proficiency-level.vo';
import { YearsOfExperience } from '../../../../domain/value-objects/years-of-experience.vo';

describe('CandidateSkillMapper', () => {
  let mapper: CandidateSkillMapper;

  beforeEach(() => {
    mapper = new CandidateSkillMapper();
  });

  const createCandidateSkillEntity = (overrides: Partial<CandidateSkillEntity> = {}): CandidateSkillEntity => {
    const entity = new CandidateSkillEntity();
    entity.id = uuidv4();
    entity.candidateId = uuidv4();
    entity.skillId = uuidv4();
    entity.description = 'Experienced with TypeScript in production projects';
    entity.proficiencyLevel = 'advanced';
    entity.yearsOfExperience = 5;
    entity.createdAt = new Date('2025-04-01T10:00:00Z');
    entity.updatedAt = new Date('2025-06-01T12:00:00Z');
    Object.assign(entity, overrides);
    return entity;
  };

  const createCandidateSkillDomain = (overrides: {
    id?: string;
    candidateId?: string;
    skillId?: string;
    description?: string | null;
    proficiencyLevel?: ProficiencyLevel | null;
    yearsOfExperience?: YearsOfExperience | null;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}): CandidateSkill => {
    return CandidateSkill.reconstitute(
      overrides.id ?? uuidv4(),
      overrides.candidateId ?? uuidv4(),
      overrides.skillId ?? uuidv4(),
      overrides.description !== undefined ? overrides.description : 'Experienced with TypeScript in production projects',
      overrides.proficiencyLevel !== undefined ? overrides.proficiencyLevel : ProficiencyLevel.advanced(),
      overrides.yearsOfExperience !== undefined ? overrides.yearsOfExperience : YearsOfExperience.fromNumber(5),
      overrides.createdAt ?? new Date('2025-04-01T10:00:00Z'),
      overrides.updatedAt ?? new Date('2025-06-01T12:00:00Z'),
    );
  };

  describe('toEntity()', () => {
    it('should map CandidateSkill to CandidateSkillEntity, serializing value objects to primitives', () => {
      const id = uuidv4();
      const candidateId = uuidv4();
      const skillId = uuidv4();
      const createdAt = new Date('2025-04-01T10:00:00Z');
      const updatedAt = new Date('2025-06-01T12:00:00Z');

      const skill = createCandidateSkillDomain({
        id,
        candidateId,
        skillId,
        description: 'Expert in React',
        proficiencyLevel: ProficiencyLevel.expert(),
        yearsOfExperience: YearsOfExperience.fromNumber(8),
        createdAt,
        updatedAt,
      });

      const entity = mapper.toEntity(skill);

      expect(entity).toBeInstanceOf(CandidateSkillEntity);
      expect(entity.id).toBe(id);
      expect(entity.candidateId).toBe(candidateId);
      expect(entity.skillId).toBe(skillId);
      expect(entity.description).toBe('Expert in React');
      expect(entity.proficiencyLevel).toBe('expert');
      expect(entity.yearsOfExperience).toBe(8);
      expect(entity.createdAt).toBe(createdAt);
      expect(entity.updatedAt).toBe(updatedAt);
    });

    it('should map null proficiencyLevel and yearsOfExperience to null', () => {
      const skill = createCandidateSkillDomain({
        proficiencyLevel: null,
        yearsOfExperience: null,
      });

      const entity = mapper.toEntity(skill);

      expect(entity.proficiencyLevel).toBeNull();
      expect(entity.yearsOfExperience).toBeNull();
    });

    it('should handle null description', () => {
      const skill = createCandidateSkillDomain({ description: null });

      const entity = mapper.toEntity(skill);

      expect(entity.description).toBeNull();
    });

    it('should serialize all proficiency levels correctly', () => {
      const levels: Array<{ level: ProficiencyLevel; expected: string }> = [
        { level: ProficiencyLevel.beginner(), expected: 'beginner' },
        { level: ProficiencyLevel.intermediate(), expected: 'intermediate' },
        { level: ProficiencyLevel.advanced(), expected: 'advanced' },
        { level: ProficiencyLevel.expert(), expected: 'expert' },
      ];

      for (const { level, expected } of levels) {
        const skill = createCandidateSkillDomain({ proficiencyLevel: level });
        const entity = mapper.toEntity(skill);
        expect(entity.proficiencyLevel).toBe(expected);
      }
    });

    it('should serialize zero years of experience correctly', () => {
      const skill = createCandidateSkillDomain({
        yearsOfExperience: YearsOfExperience.zero(),
      });

      const entity = mapper.toEntity(skill);

      expect(entity.yearsOfExperience).toBe(0);
    });
  });

  describe('toDomain()', () => {
    it('should map CandidateSkillEntity to CandidateSkill, deserializing ProficiencyLevel and YearsOfExperience', () => {
      const id = uuidv4();
      const candidateId = uuidv4();
      const skillId = uuidv4();
      const entity = createCandidateSkillEntity({ id, candidateId, skillId });

      const skill = mapper.toDomain(entity);

      expect(skill.id).toBe(id);
      expect(skill.candidateId).toBe(candidateId);
      expect(skill.skillId).toBe(skillId);
      expect(skill.description).toBe('Experienced with TypeScript in production projects');
      expect(skill.proficiencyLevel).not.toBeNull();
      expect(skill.proficiencyLevel!.value).toBe('advanced');
      expect(skill.proficiencyLevel!.isAdvanced()).toBe(true);
      expect(skill.yearsOfExperience).not.toBeNull();
      expect(skill.yearsOfExperience!.value).toBe(5);
      expect(skill.createdAt).toEqual(new Date('2025-04-01T10:00:00Z'));
      expect(skill.updatedAt).toEqual(new Date('2025-06-01T12:00:00Z'));
    });

    it('should handle null proficiencyLevel in entity', () => {
      const entity = createCandidateSkillEntity({ proficiencyLevel: null });

      const skill = mapper.toDomain(entity);

      expect(skill.proficiencyLevel).toBeNull();
    });

    it('should handle null yearsOfExperience in entity', () => {
      const entity = createCandidateSkillEntity({ yearsOfExperience: null });

      const skill = mapper.toDomain(entity);

      expect(skill.yearsOfExperience).toBeNull();
    });

    it('should handle both null proficiencyLevel and yearsOfExperience', () => {
      const entity = createCandidateSkillEntity({
        proficiencyLevel: null,
        yearsOfExperience: null,
        description: null,
      });

      const skill = mapper.toDomain(entity);

      expect(skill.proficiencyLevel).toBeNull();
      expect(skill.yearsOfExperience).toBeNull();
      expect(skill.description).toBeNull();
    });

    it('should deserialize all proficiency levels from entity', () => {
      const entityLevels: Array<{
        level: CandidateSkillEntity['proficiencyLevel'];
        check: (p: ProficiencyLevel) => boolean;
      }> = [
        { level: 'beginner', check: (p) => p.isBeginner() },
        { level: 'intermediate', check: (p) => p.isIntermediate() },
        { level: 'advanced', check: (p) => p.isAdvanced() },
        { level: 'expert', check: (p) => p.isExpert() },
      ];

      for (const { level, check } of entityLevels) {
        const entity = createCandidateSkillEntity({ proficiencyLevel: level });
        const skill = mapper.toDomain(entity);
        expect(skill.proficiencyLevel).not.toBeNull();
        expect(check(skill.proficiencyLevel!)).toBe(true);
      }
    });

    it('should deserialize zero years of experience from entity', () => {
      const entity = createCandidateSkillEntity({ yearsOfExperience: 0 });

      const skill = mapper.toDomain(entity);

      expect(skill.yearsOfExperience).not.toBeNull();
      expect(skill.yearsOfExperience!.value).toBe(0);
    });
  });

  describe('toDomainList()', () => {
    it('should map array of entities to domain models', () => {
      const entities = [
        createCandidateSkillEntity({ description: 'Skill A', proficiencyLevel: 'beginner' }),
        createCandidateSkillEntity({ description: 'Skill B', proficiencyLevel: 'intermediate' }),
        createCandidateSkillEntity({ description: 'Skill C', proficiencyLevel: 'expert' }),
      ];

      const skills = mapper.toDomainList(entities);

      expect(skills).toHaveLength(3);
      expect(skills[0].description).toBe('Skill A');
      expect(skills[0].proficiencyLevel!.isBeginner()).toBe(true);
      expect(skills[1].description).toBe('Skill B');
      expect(skills[1].proficiencyLevel!.isIntermediate()).toBe(true);
      expect(skills[2].description).toBe('Skill C');
      expect(skills[2].proficiencyLevel!.isExpert()).toBe(true);
    });

    it('should return empty array for empty input', () => {
      const skills = mapper.toDomainList([]);
      expect(skills).toHaveLength(0);
    });
  });

  describe('round-trip', () => {
    it('should preserve all values through toDomain(toEntity(candidateSkill))', () => {
      const id = uuidv4();
      const candidateId = uuidv4();
      const skillId = uuidv4();
      const createdAt = new Date('2025-03-01T00:00:00Z');
      const updatedAt = new Date('2025-05-15T00:00:00Z');

      const original = CandidateSkill.reconstitute(
        id,
        candidateId,
        skillId,
        'Round trip skill description',
        ProficiencyLevel.intermediate(),
        YearsOfExperience.fromNumber(3),
        createdAt,
        updatedAt,
      );

      const entity = mapper.toEntity(original);
      const restored = mapper.toDomain(entity);

      expect(restored.id).toBe(original.id);
      expect(restored.candidateId).toBe(original.candidateId);
      expect(restored.skillId).toBe(original.skillId);
      expect(restored.description).toBe(original.description);
      expect(restored.proficiencyLevel!.value).toBe(original.proficiencyLevel!.value);
      expect(restored.yearsOfExperience!.value).toBe(original.yearsOfExperience!.value);
      expect(restored.createdAt).toEqual(original.createdAt);
      expect(restored.updatedAt).toEqual(original.updatedAt);
    });

    it('should preserve null values through round-trip', () => {
      const original = createCandidateSkillDomain({
        description: null,
        proficiencyLevel: null,
        yearsOfExperience: null,
      });

      const entity = mapper.toEntity(original);
      const restored = mapper.toDomain(entity);

      expect(restored.description).toBeNull();
      expect(restored.proficiencyLevel).toBeNull();
      expect(restored.yearsOfExperience).toBeNull();
    });
  });
});
