import { QuestionResponseDto } from './question.response.dto';
import { InterviewSettingsResponseDto } from './interview-settings.response.dto';

export class TemplateResponseDto {
  id: string;
  title: string;
  description: string;
  status: string; // 'draft' | 'active' | 'archived'
  createdBy: string;
  settings: InterviewSettingsResponseDto;
  questions: QuestionResponseDto[];
  questionsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplateListItemDto {
  id: string;
  title: string;
  description: string;
  status: string;
  createdBy: string;
  questionsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedTemplatesResponseDto {
  items: TemplateListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
