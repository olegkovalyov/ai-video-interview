export type CandidateStatus = 'completed' | 'in_progress' | 'pending' | 'invited';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  position: string;
  interview: string;
  interviewId?: string;
  status: CandidateStatus;
  score: number | null;
  appliedAt: string;
  completedAt: string | null;
  avatarUrl?: string;
}

export interface CandidateStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export interface CandidateFilters {
  search: string;
  status: CandidateStatus | 'all';
  interview: string | 'all';
}
