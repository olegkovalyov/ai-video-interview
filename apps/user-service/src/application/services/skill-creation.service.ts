import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Skill } from '../../domain/entities/skill.entity';
import type { ISkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  SkillAlreadyExistsException,
  SkillCategoryNotFoundException,
} from '../../domain/exceptions/skill.exceptions';
import { LoggerService } from '../../infrastructure/logger/logger.service';

export interface CreateSkillInput {
  name: string;
  slug: string;
  categoryId: string | null;
  description: string | null;
  adminId: string;
}

/**
 * Application service that owns the "create new skill" use case.
 *
 * No outbox event yet — skills are admin-managed reference data, not
 * cross-service domain. Add an integration event when another service
 * starts caching the catalogue.
 */
@Injectable()
export class SkillCreationService {
  constructor(
    @Inject('ISkillRepository')
    private readonly skillRepository: ISkillRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(input: CreateSkillInput): Promise<{ skillId: string }> {
    this.logger.info('Creating new skill', {
      name: input.name,
      slug: input.slug,
      adminId: input.adminId,
    });

    await this.assertSlugUnique(input.slug);
    await this.assertCategoryExists(input.categoryId);

    const skillId = uuid();
    const skill = Skill.create({
      id: skillId,
      name: input.name,
      slug: input.slug,
      categoryId: input.categoryId,
      description: input.description,
    });
    await this.skillRepository.save(skill);

    this.logger.info('Skill created successfully', {
      skillId,
      name: input.name,
    });

    return { skillId };
  }

  private async assertSlugUnique(slug: string): Promise<void> {
    const existing = await this.skillRepository.findBySlug(slug);
    if (existing) throw new SkillAlreadyExistsException(slug);
  }

  private async assertCategoryExists(categoryId: string | null): Promise<void> {
    if (categoryId === null) return;
    const exists = await this.skillRepository.categoryExists(categoryId);
    if (!exists) throw new SkillCategoryNotFoundException(categoryId);
  }
}
