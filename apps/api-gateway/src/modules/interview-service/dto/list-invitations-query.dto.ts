import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListInvitationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['pending', 'in_progress', 'completed', 'expired'],
    description: 'Filter by invitation status',
  })
  @IsOptional()
  @IsString()
  status?: 'pending' | 'in_progress' | 'completed' | 'expired';

  @ApiPropertyOptional({ description: 'Filter by template UUID' })
  @IsOptional()
  @IsString()
  templateId?: string;
}
