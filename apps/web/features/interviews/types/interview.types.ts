export type InterviewStatus = 'draft' | 'active' | 'closed' | 'completed';

export interface Interview {
  id: string;
  title: string;
  description: string;
  status: InterviewStatus;
  questionsCount?: number;
  candidatesCount?: number;
  candidates?: number; // alias for candidatesCount
  responsesCount?: number;
  responses?: number; // alias for responsesCount
  createdAt: string;
  duration?: number; // in minutes
  publicUrl?: string;
}

export interface InterviewStats {
  total: number;
  active: number;
  draft: number;
  completed: number;
  totalCandidates: number;
  totalResponses: number;
}

export interface InterviewFilters {
  search: string;
  status: InterviewStatus | 'all';
}
