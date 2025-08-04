export interface Interview {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  status: InterviewStatus;
  publicLinkToken: string;
  expiresAt?: Date;
  settings: InterviewSettings;
  createdAt: Date;
  updatedAt: Date;
}

export enum InterviewStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export interface InterviewSettings {
  allowRetake: boolean;
  timeLimit?: number; // in minutes
  requireCandidateInfo: boolean;
  notifyOnCompletion: boolean;
}

export interface Question {
  id: string;
  interviewId: string;
  text: string;
  type: QuestionType;
  orderIndex: number;
  timeLimitSeconds: number;
  isRequired: boolean;
  createdAt: Date;
}

export enum QuestionType {
  VIDEO = 'video',
  AUDIO = 'audio'
}

export interface CandidateSession {
  id: string;
  interviewId: string;
  candidateEmail?: string;
  candidateName?: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  userAgent?: string;
  ipAddress?: string;
  metadata: Record<string, any>;
}

export enum SessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

export interface CandidateResponse {
  id: string;
  sessionId: string;
  questionId: string;
  mediaFileId?: string;
  durationSeconds?: number;
  recordedAt: Date;
  metadata: Record<string, any>;
}
