import { describe, it, expect } from 'vitest';
import { interviewReducer, initialInterviewState, getDerivedState } from '../interview-reducer';
import type { InterviewState } from '../../_types/interview.types';
import type { InvitationWithDetails } from '@/lib/api/invitations';

const mockInvitation: InvitationWithDetails = {
  id: 'inv-1',
  templateId: 'tpl-1',
  candidateId: 'cand-1',
  companyName: 'Test Corp',
  invitedBy: 'hr-1',
  status: 'in_progress',
  allowPause: false,
  showTimer: true,
  expiresAt: '2026-12-31T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  templateTitle: 'Test Interview',
  questions: [
    { id: 'q1', text: 'Q1', type: 'text', order: 1, required: true },
    { id: 'q2', text: 'Q2', type: 'multiple_choice', order: 2, required: false, options: [{ text: 'A', isCorrect: true }] },
  ],
  responses: [],
};

describe('interviewReducer', () => {
  it('handles LOAD_START', () => {
    const state = interviewReducer(initialInterviewState, { type: 'LOAD_START' });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('handles LOAD_SUCCESS', () => {
    const state = interviewReducer(initialInterviewState, {
      type: 'LOAD_SUCCESS',
      invitation: mockInvitation,
      startIndex: 1,
    });
    expect(state.loading).toBe(false);
    expect(state.invitation).toBe(mockInvitation);
    expect(state.currentQuestionIndex).toBe(1);
  });

  it('handles LOAD_ERROR', () => {
    const state = interviewReducer(initialInterviewState, {
      type: 'LOAD_ERROR',
      error: 'Not found',
    });
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Not found');
  });

  it('handles SET_QUESTION_INDEX and resets questionStartTime', () => {
    const before = Date.now();
    const state = interviewReducer(initialInterviewState, { type: 'SET_QUESTION_INDEX', index: 3 });
    expect(state.currentQuestionIndex).toBe(3);
    expect(state.questionStartTime).toBeGreaterThanOrEqual(before);
  });

  it('handles UPDATE_ANSWER', () => {
    const state = interviewReducer(initialInterviewState, {
      type: 'UPDATE_ANSWER',
      questionId: 'q1',
      field: 'textAnswer',
      value: 'My answer',
      questionStartTime: Date.now() - 5000,
    });
    expect(state.answers['q1']?.textAnswer).toBe('My answer');
    expect(state.answers['q1']?.duration).toBeGreaterThanOrEqual(4);
  });

  it('handles SUBMIT_START and SUBMIT_ERROR', () => {
    let state = interviewReducer(initialInterviewState, { type: 'SUBMIT_START' });
    expect(state.submitting).toBe(true);
    state = interviewReducer(state, { type: 'SUBMIT_ERROR' });
    expect(state.submitting).toBe(false);
  });

  it('handles SUBMIT_SUCCESS with nextIndex', () => {
    const updated = { ...mockInvitation, responses: [{ id: 'r1', questionId: 'q1', questionIndex: 0, questionText: 'Q1', responseType: 'text' as const, textAnswer: 'A', duration: 5, submittedAt: '2026-01-01' }] };
    const state = interviewReducer(initialInterviewState, {
      type: 'SUBMIT_SUCCESS',
      invitation: updated,
      nextIndex: 1,
    });
    expect(state.submitting).toBe(false);
    expect(state.invitation).toBe(updated);
    expect(state.currentQuestionIndex).toBe(1);
  });

  it('handles TICK_TIMER', () => {
    const state = interviewReducer({ ...initialInterviewState, elapsedTime: 10 }, { type: 'TICK_TIMER' });
    expect(state.elapsedTime).toBe(11);
  });

  it('handles RECORD_VIOLATION and END_INTERVIEW at max', () => {
    let state = initialInterviewState;
    state = interviewReducer(state, { type: 'RECORD_VIOLATION' });
    expect(state.violations).toBe(1);
    expect(state.showViolationWarning).toBe(true);
    expect(state.interviewEnded).toBe(false);

    state = interviewReducer(state, { type: 'RECORD_VIOLATION' });
    expect(state.violations).toBe(2);

    state = interviewReducer(state, { type: 'RECORD_VIOLATION' });
    expect(state.violations).toBe(3);
    expect(state.interviewEnded).toBe(true);
  });

  it('handles DISMISS_WARNING', () => {
    const state = interviewReducer(
      { ...initialInterviewState, showViolationWarning: true },
      { type: 'DISMISS_WARNING' },
    );
    expect(state.showViolationWarning).toBe(false);
  });
});

describe('getDerivedState', () => {
  it('computes derived values from state', () => {
    const state: InterviewState = {
      ...initialInterviewState,
      invitation: mockInvitation,
      currentQuestionIndex: 0,
    };
    const derived = getDerivedState(state);

    expect(derived.questions).toHaveLength(2);
    expect(derived.currentQuestion?.id).toBe('q1');
    expect(derived.totalQuestions).toBe(2);
    expect(derived.templateTitle).toBe('Test Interview');
    expect(derived.answeredQuestions).toBe(0);
    expect(derived.progressPercent).toBe(0);
    expect(derived.allAnswered).toBe(false);
    expect(derived.currentAnswered).toBe(false);
  });

  it('computes progress with responses', () => {
    const withResponse = {
      ...mockInvitation,
      responses: [{ id: 'r1', questionId: 'q1', questionIndex: 0, questionText: 'Q1', responseType: 'text' as const, textAnswer: 'A', duration: 5, submittedAt: '2026-01-01' }],
    };
    const state: InterviewState = {
      ...initialInterviewState,
      invitation: withResponse,
      currentQuestionIndex: 0,
    };
    const derived = getDerivedState(state);

    expect(derived.answeredQuestions).toBe(1);
    expect(derived.progressPercent).toBe(50);
    expect(derived.currentAnswered).toBe(true);
  });

  it('handles null invitation', () => {
    const derived = getDerivedState(initialInterviewState);
    expect(derived.questions).toEqual([]);
    expect(derived.currentQuestion).toBeUndefined();
    expect(derived.totalQuestions).toBe(0);
  });
});
