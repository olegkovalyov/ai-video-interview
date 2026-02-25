import { v4 as uuidv4 } from 'uuid';
import { UserCompanyMapper } from '../user-company.mapper';
import { UserCompany } from '../../../../domain/entities/user-company.entity';
import { UserCompanyEntity } from '../../entities/user-company.entity';

describe('UserCompanyMapper', () => {
  let mapper: UserCompanyMapper;

  beforeEach(() => {
    mapper = new UserCompanyMapper();
  });

  const createUserCompanyEntity = (overrides: Partial<UserCompanyEntity> = {}): UserCompanyEntity => {
    const entity = new UserCompanyEntity();
    entity.id = uuidv4();
    entity.userId = uuidv4();
    entity.companyId = uuidv4();
    entity.position = 'Senior Developer';
    entity.isPrimary = true;
    entity.joinedAt = new Date('2025-03-15T09:00:00Z');
    Object.assign(entity, overrides);
    return entity;
  };

  const createUserCompanyDomain = (overrides: {
    id?: string;
    userId?: string;
    companyId?: string;
    position?: string | null;
    isPrimary?: boolean;
    joinedAt?: Date;
  } = {}): UserCompany => {
    return UserCompany.reconstitute(
      overrides.id ?? uuidv4(),
      overrides.userId ?? uuidv4(),
      overrides.companyId ?? uuidv4(),
      overrides.position !== undefined ? overrides.position : 'Senior Developer',
      overrides.isPrimary ?? true,
      overrides.joinedAt ?? new Date('2025-03-15T09:00:00Z'),
    );
  };

  describe('toEntity()', () => {
    it('should map UserCompany to UserCompanyEntity with all fields', () => {
      const id = uuidv4();
      const userId = uuidv4();
      const companyId = uuidv4();
      const joinedAt = new Date('2025-03-15T09:00:00Z');

      const userCompany = createUserCompanyDomain({
        id,
        userId,
        companyId,
        position: 'CTO',
        isPrimary: true,
        joinedAt,
      });

      const entity = mapper.toEntity(userCompany);

      expect(entity).toBeInstanceOf(UserCompanyEntity);
      expect(entity.id).toBe(id);
      expect(entity.userId).toBe(userId);
      expect(entity.companyId).toBe(companyId);
      expect(entity.position).toBe('CTO');
      expect(entity.isPrimary).toBe(true);
      expect(entity.joinedAt).toBe(joinedAt);
    });

    it('should handle null position', () => {
      const userCompany = createUserCompanyDomain({ position: null });

      const entity = mapper.toEntity(userCompany);

      expect(entity.position).toBeNull();
    });

    it('should map isPrimary false correctly', () => {
      const userCompany = createUserCompanyDomain({ isPrimary: false });

      const entity = mapper.toEntity(userCompany);

      expect(entity.isPrimary).toBe(false);
    });
  });

  describe('toDomain()', () => {
    it('should map UserCompanyEntity to UserCompany domain model', () => {
      const id = uuidv4();
      const userId = uuidv4();
      const companyId = uuidv4();
      const entity = createUserCompanyEntity({ id, userId, companyId });

      const userCompany = mapper.toDomain(entity);

      expect(userCompany.id).toBe(id);
      expect(userCompany.userId).toBe(userId);
      expect(userCompany.companyId).toBe(companyId);
      expect(userCompany.position).toBe('Senior Developer');
      expect(userCompany.isPrimary).toBe(true);
      expect(userCompany.joinedAt).toEqual(new Date('2025-03-15T09:00:00Z'));
    });

    it('should handle null position in entity', () => {
      const entity = createUserCompanyEntity({ position: null });

      const userCompany = mapper.toDomain(entity);

      expect(userCompany.position).toBeNull();
    });

    it('should handle isPrimary false in entity', () => {
      const entity = createUserCompanyEntity({ isPrimary: false });

      const userCompany = mapper.toDomain(entity);

      expect(userCompany.isPrimary).toBe(false);
    });
  });

  describe('toDomainList()', () => {
    it('should map array of entities to domain models', () => {
      const entities = [
        createUserCompanyEntity({ position: 'Developer', isPrimary: false }),
        createUserCompanyEntity({ position: 'Team Lead', isPrimary: true }),
        createUserCompanyEntity({ position: null, isPrimary: false }),
      ];

      const userCompanies = mapper.toDomainList(entities);

      expect(userCompanies).toHaveLength(3);
      expect(userCompanies[0].position).toBe('Developer');
      expect(userCompanies[0].isPrimary).toBe(false);
      expect(userCompanies[1].position).toBe('Team Lead');
      expect(userCompanies[1].isPrimary).toBe(true);
      expect(userCompanies[2].position).toBeNull();
      expect(userCompanies[2].isPrimary).toBe(false);
    });

    it('should return empty array for empty input', () => {
      const userCompanies = mapper.toDomainList([]);
      expect(userCompanies).toHaveLength(0);
    });
  });

  describe('round-trip', () => {
    it('should preserve all values through toDomain(toEntity(userCompany))', () => {
      const id = uuidv4();
      const userId = uuidv4();
      const companyId = uuidv4();
      const joinedAt = new Date('2025-02-01T00:00:00Z');

      const original = UserCompany.reconstitute(
        id,
        userId,
        companyId,
        'Product Manager',
        true,
        joinedAt,
      );

      const entity = mapper.toEntity(original);
      const restored = mapper.toDomain(entity);

      expect(restored.id).toBe(original.id);
      expect(restored.userId).toBe(original.userId);
      expect(restored.companyId).toBe(original.companyId);
      expect(restored.position).toBe(original.position);
      expect(restored.isPrimary).toBe(original.isPrimary);
      expect(restored.joinedAt).toEqual(original.joinedAt);
    });

    it('should preserve null position through round-trip', () => {
      const original = createUserCompanyDomain({ position: null });

      const entity = mapper.toEntity(original);
      const restored = mapper.toDomain(entity);

      expect(restored.position).toBeNull();
    });
  });
});
