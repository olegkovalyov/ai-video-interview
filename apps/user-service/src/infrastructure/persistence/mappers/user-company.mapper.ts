import { Injectable } from '@nestjs/common';
import { UserCompany } from '../../../domain/entities/user-company.entity';
import { UserCompanyEntity } from '../entities/user-company.entity';

@Injectable()
export class UserCompanyMapper {
  toEntity(userCompany: UserCompany): UserCompanyEntity {
    const entity = new UserCompanyEntity();
    
    entity.id = userCompany.id;
    entity.userId = userCompany.userId;
    entity.companyId = userCompany.companyId;
    entity.position = userCompany.position;
    entity.isPrimary = userCompany.isPrimary;
    entity.joinedAt = userCompany.joinedAt;
    
    return entity;
  }

  toDomain(entity: UserCompanyEntity): UserCompany {
    return UserCompany.reconstitute(
      entity.id,
      entity.userId,
      entity.companyId,
      entity.position,
      entity.isPrimary,
      entity.joinedAt,
    );
  }

  toDomainList(entities: UserCompanyEntity[]): UserCompany[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
