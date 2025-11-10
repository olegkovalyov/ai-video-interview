/**
 * Template Types
 * Based on Interview Service OpenAPI contracts
 */

export type TemplateStatus = 'draft' | 'active' | 'archived';
export type QuestionType = 'video' | 'text' | 'multiple_choice';

export interface InterviewSettings {
  totalTimeLimit: number;      // minutes
  allowRetakes: boolean;
  showTimer: boolean;
  randomizeQuestions: boolean;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  order: number;
  timeLimit: number;           // seconds
  required: boolean;
  hints?: string;
  createdAt: string;
  options?: QuestionOption[];  // For multiple_choice questions
}

export interface Template {
  id: string;
  title: string;
  description: string;
  status: TemplateStatus;
  createdBy: string;
  questionsCount: number;
  createdAt: string;
  updatedAt: string;
  settings?: InterviewSettings;
  questions?: Question[];      // Only in detail view
}

export interface PaginatedTemplates {
  items: Template[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTemplateDto {
  title: string;
  description: string;
  settings?: InterviewSettings;
}

export interface UpdateTemplateDto {
  title?: string;
  description?: string;
  settings?: InterviewSettings;
}

export interface AddQuestionDto {
  text: string;
  type: QuestionType;
  order: number;
  timeLimit: number;
  required: boolean;
  hints?: string;
  options?: QuestionOption[];  // For multiple_choice questions
}

export interface ReorderQuestionsDto {
  questionIds: string[];
}

export interface TemplateFilters {
  status?: TemplateStatus | 'all';
  search?: string;
}

export interface TemplateStats {
  total: number;
  active: number;
  draft: number;
  archived: number;
}
