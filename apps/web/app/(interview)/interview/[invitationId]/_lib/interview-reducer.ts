import type { InterviewState, InterviewAction, DerivedInterviewState } from '../_types/interview.types';
import { INTERVIEW } from '@/lib/constants/app';

export const initialInterviewState: InterviewState = {
  invitation: null,
  loading: true,
  error: null,
  currentQuestionIndex: 0,
  answers: {},
  submitting: false,
  completing: false,
  questionStartTime: Date.now(),
  elapsedTime: 0,
  violations: 0,
  showViolationWarning: false,
  interviewEnded: false,
};

export function interviewReducer(state: InterviewState, action: InterviewAction): InterviewState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };

    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        invitation: action.invitation,
        currentQuestionIndex: action.startIndex,
        questionStartTime: Date.now(),
      };

    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.error };

    case 'SET_QUESTION_INDEX':
      return {
        ...state,
        currentQuestionIndex: action.index,
        questionStartTime: Date.now(),
      };

    case 'UPDATE_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: {
            ...state.answers[action.questionId],
            [action.field]: action.value,
            duration: Math.floor((Date.now() - action.questionStartTime) / 1000),
          },
        },
      };

    case 'SUBMIT_START':
      return { ...state, submitting: true };

    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        submitting: false,
        invitation: action.invitation,
        currentQuestionIndex: action.nextIndex ?? state.currentQuestionIndex,
        questionStartTime: Date.now(),
      };

    case 'SUBMIT_ERROR':
      return { ...state, submitting: false };

    case 'COMPLETE_START':
      return { ...state, completing: true };

    case 'COMPLETE_ERROR':
      return { ...state, completing: false };

    case 'TICK_TIMER':
      return { ...state, elapsedTime: state.elapsedTime + 1 };

    case 'RECORD_VIOLATION': {
      const newViolations = state.violations + 1;
      const ended = newViolations >= INTERVIEW.MAX_VIOLATIONS;
      return {
        ...state,
        violations: newViolations,
        showViolationWarning: true,
        interviewEnded: ended || state.interviewEnded,
      };
    }

    case 'DISMISS_WARNING':
      return { ...state, showViolationWarning: false };

    case 'END_INTERVIEW':
      return { ...state, interviewEnded: true, showViolationWarning: true };

    default:
      return state;
  }
}

export function getDerivedState(state: InterviewState): DerivedInterviewState {
  const { invitation, currentQuestionIndex } = state;

  const questions = invitation?.questions || invitation?.template?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const templateTitle = invitation?.templateTitle || invitation?.template?.title || 'Interview';
  const answeredQuestions = invitation?.responses?.length || 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  const allAnswered = answeredQuestions >= totalQuestions;
  const currentAnswered = currentQuestion
    ? invitation?.responses?.some(r => r.questionId === currentQuestion.id) || false
    : false;

  return {
    questions,
    currentQuestion,
    totalQuestions,
    templateTitle,
    answeredQuestions,
    progressPercent,
    allAnswered,
    currentAnswered,
  };
}
