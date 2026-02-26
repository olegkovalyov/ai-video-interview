import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListTemplatesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['draft', 'active', 'archived'], description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: 'draft' | 'active' | 'archived';
}
