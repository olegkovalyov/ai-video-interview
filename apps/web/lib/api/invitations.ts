/**
 * Invitations API Client
 * Methods for working with Interview Invitations via API Gateway
 */

import { apiGet, apiPost } from '@/lib/api';

// ========================================
// TYPES
// ========================================

export type InvitationStatus = 'pending' | 'in_progress' | 'completed' | 'expired';

export interface Invitation {
  id: string;
  templateId: string;
  candidateId: string;
  companyName: string;
  invitedBy: string;
  status: InvitationStatus;
  allowPause: boolean;
  showTimer: boolean;
  expiresAt: string;
  startedAt?: string;
  completedAt?: string;
  lastActivityAt?: string;
  completedReason?: 'manual' | 'auto_timeout' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 'text' | 'multiple_choice' | 'video';

export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  order: number;
  timeLimit?: number;
  required: boolean;
  hints?: string;
  options?: QuestionOption[];
}

export interface InvitationWithDetails extends Invitation {
  // When includeTemplate=true, these fields are included at top level
  templateTitle?: string;
  templateDescription?: string;
  questions?: Question[];
  
  // Nested template object (for backward compatibility)
  template?: {
    id: string;
    title: string;
    description?: string;
    questionsCount: number;
    questions?: Question[];
  };
  candidate?: {
    id: string;
    fullName: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
  };
  progress?: {
    answered: number;
    total: number;
    percentage: number;
  };
  responses?: InvitationResponse[];
}

// List item from paginated response
export interface InvitationListItem {
  id: string;
  templateId: string;
  templateTitle: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  companyName: string;
  status: InvitationStatus;
  allowPause: boolean;
  expiresAt: string;
  startedAt?: string;
  progress: {
    answered: number;
    total: number;
    percentage: number;
  };
  createdAt: string;
}

export interface InvitationResponse {
  id: string;
  questionId: string;
  questionIndex: number;
  questionText: string;
  responseType: 'text' | 'code' | 'video';
  textAnswer?: string;
  codeAnswer?: string;
  videoUrl?: string;
  duration: number;
  submittedAt: string;
}

export interface CreateInvitationDto {
  templateId: string;
  candidateId: string;
  companyName: string;  // Note: API expects companyName (string), not companyId
  expiresAt: string;
  allowPause?: boolean;
  showTimer?: boolean;
}

export interface SubmitResponseDto {
  questionId: string;
  questionIndex: number;
  questionText: string;
  responseType: 'text' | 'code' | 'video';
  textAnswer?: string;
  codeAnswer?: string;
  videoUrl?: string;
  duration: number;
}

export interface InvitationsListResponse {
  items: InvitationListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvitationFilters {
  status?: InvitationStatus;
  templateId?: string;
  page?: number;
  limit?: number;
}

// ========================================
// HR API FUNCTIONS
// ========================================

/**
 * Create invitation (HR)
 * POST /api/invitations
 */
export async function createInvitation(dto: CreateInvitationDto): Promise<Invitation> {
  return apiPost<Invitation>('/api/invitations', dto);
}

/**
 * List invitations created by current HR
 * GET /api/invitations/hr
 */
export async function listHRInvitations(filters: InvitationFilters = {}): Promise<InvitationsListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.templateId) params.append('templateId', filters.templateId);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  
  const queryString = params.toString();
  const url = queryString ? `/api/invitations/hr?${queryString}` : '/api/invitations/hr';
  
  return apiGet<InvitationsListResponse>(url);
}

// ========================================
// CANDIDATE API FUNCTIONS
// ========================================

/**
 * List invitations for current candidate
 * GET /api/invitations/candidate
 */
export async function listCandidateInvitations(filters: InvitationFilters = {}): Promise<InvitationsListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  
  const queryString = params.toString();
  const url = queryString ? `/api/invitations/candidate?${queryString}` : '/api/invitations/candidate';
  
  return apiGet<InvitationsListResponse>(url);
}

/**
 * Get invitation details
 * GET /api/invitations/:id
 */
export async function getInvitation(id: string, includeTemplate = false): Promise<InvitationWithDetails> {
  const url = includeTemplate 
    ? `/api/invitations/${id}?includeTemplate=true` 
    : `/api/invitations/${id}`;
  return apiGet<InvitationWithDetails>(url);
}

/**
 * Start interview (Candidate)
 * POST /api/invitations/:id/start
 */
export async function startInvitation(id: string): Promise<Invitation> {
  return apiPost<Invitation>(`/api/invitations/${id}/start`, {});
}

/**
 * Submit response to a question (Candidate)
 * POST /api/invitations/:id/responses
 */
export async function submitResponse(id: string, dto: SubmitResponseDto): Promise<InvitationResponse> {
  return apiPost<InvitationResponse>(`/api/invitations/${id}/responses`, dto);
}

/**
 * Complete interview (Candidate)
 * POST /api/invitations/:id/complete
 */
export async function completeInvitation(id: string): Promise<Invitation> {
  return apiPost<Invitation>(`/api/invitations/${id}/complete`, {});
}

/**
 * Send heartbeat for non-pausable interviews (Candidate)
 * POST /api/invitations/:id/heartbeat
 */
export async function sendHeartbeat(id: string): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/api/invitations/${id}/heartbeat`, {});
}
