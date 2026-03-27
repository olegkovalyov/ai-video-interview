import type { InvitationWithDetails, Question } from '@/lib/api/invitations';

export interface AnswerState {
  [questionId: string]: {
    textAnswer?: string;
    selectedOption?: string;
    duration: number;
  };
}

export interface InterviewState {
  invitation: InvitationWithDetails | null;
  loading: boolean;
  error: string | null;
  currentQuestionIndex: number;
  answers: AnswerState;
  submitting: boolean;
  completing: boolean;
  questionStartTime: number;
  elapsedTime: number;
  violations: number;
  showViolationWarning: boolean;
  interviewEnded: boolean;
}

export type InterviewAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; invitation: InvitationWithDetails; startIndex: number }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'SET_QUESTION_INDEX'; index: number }
  | { type: 'UPDATE_ANSWER'; questionId: string; field: 'textAnswer' | 'selectedOption'; value: string; questionStartTime: number }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; invitation: InvitationWithDetails; nextIndex?: number }
  | { type: 'SUBMIT_ERROR' }
  | { type: 'COMPLETE_START' }
  | { type: 'COMPLETE_ERROR' }
  | { type: 'TICK_TIMER' }
  | { type: 'RECORD_VIOLATION' }
  | { type: 'DISMISS_WARNING' }
  | { type: 'END_INTERVIEW' };

export interface DerivedInterviewState {
  questions: Question[];
  currentQuestion: Question | undefined;
  totalQuestions: number;
  templateTitle: string;
  answeredQuestions: number;
  progressPercent: number;
  allAnswered: boolean;
  currentAnswered: boolean;
}
