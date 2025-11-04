import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HRProfile } from '../../../domain/aggregates/hr-profile.aggregate';
import { IHRProfileRepository } from '../../../domain/repositories/hr-profile.repository.interface';
import { HRProfileEntity } from '../entities/hr-profile.entity';
import { HRProfileMapper } from '../mappers/hr-profile.mapper';

/**
 * TypeORM implementation of HRProfile repository
 */
@Injectable()
export class TypeOrmHRProfileRepository implements IHRProfileRepository {
  constructor(
    @InjectRepository(HRProfileEntity)
    private readonly repository: Repository<HRProfileEntity>,
  ) {}

  /**
   * Save HR profile (create or update)
   */
  async save(profile: HRProfile): Promise<HRProfile> {
    const entity = HRProfileMapper.toPersistence(profile);
    const saved = await this.repository.save(entity);
    return HRProfileMapper.toDomain(saved);
  }

  /**
   * Find HR profile by user ID
   */
  async findByUserId(userId: string): Promise<HRProfile | null> {
    const entity = await this.repository.findOne({
      where: { userId },
    });

    return entity ? HRProfileMapper.toDomain(entity) : null;
  }

  /**
   * Delete HR profile
   */
  async delete(userId: string): Promise<void> {
    await this.repository.delete({ userId });
  }
}
