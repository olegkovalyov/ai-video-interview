import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class SearchCandidatesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: [String], description: 'Skill IDs to search for' })
  @IsOptional()
  skillIds?: string | string[];

  @ApiPropertyOptional({ enum: ['beginner', 'intermediate', 'advanced', 'expert'] })
  @IsOptional()
  @IsString()
  minProficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @ApiPropertyOptional({ description: 'Minimum years of experience' })
  @IsOptional()
  @Type(() => Number)
  minYears?: number;

  @ApiPropertyOptional({ enum: ['junior', 'mid', 'senior', 'lead'] })
  @IsOptional()
  @IsString()
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead';
}
