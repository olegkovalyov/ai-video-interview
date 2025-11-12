import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetSkillQuery } from './get-skill.query';
import type { ISkillReadRepository, SkillWithCategory } from '../../../../domain/repositories/skill-read.repository.interface';

@QueryHandler(GetSkillQuery)
export class GetSkillHandler implements IQueryHandler<GetSkillQuery> {
  constructor(
    @Inject('ISkillReadRepository')
    private readonly skillReadRepository: ISkillReadRepository,
  ) {}

  async execute(query: GetSkillQuery): Promise<SkillWithCategory> {
    const result = await this.skillReadRepository.findByIdWithCategory(query.skillId);
    
    if (!result) {
      throw new NotFoundException(`Skill with ID "${query.skillId}" not found`);
    }

    return result;
  }
}
