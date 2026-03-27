'use client';

import { useReducer, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { interviewReducer, initialInterviewState, getDerivedState } from './_lib/interview-reducer';
import { useInterviewFlow } from './_hooks/useInterviewFlow';
import { useInterviewTimer } from './_hooks/useInterviewTimer';
import { useHeartbeat } from './_hooks/useHeartbeat';
import { useProctoring } from './_hooks/useProctoring';
import { LoadingScreen, ErrorScreen, StatusScreen } from './_components/InterviewStatusScreen';
import { ViolationWarning } from './_components/ViolationWarning';
import { InterviewHeader } from './_components/InterviewHeader';
import { QuestionCard } from './_components/QuestionCard';

export default function InterviewPage() {
  const params = useParams();
  const invitationId = params.invitationId as string;

  const [state, dispatch] = useReducer(interviewReducer, initialInterviewState);
  const derived = getDerivedState(state);

  const {
    handleAnswerChange,
    handleSubmitAnswer,
    handleComplete,
    goToPrevious,
    goToNext,
    goToQuestion,
    handleSaveAndExit,
  } = useInterviewFlow(invitationId, state, derived, dispatch);

  useInterviewTimer(
    state.invitation?.showTimer ?? false,
    state.invitation?.status,
    dispatch,
  );

  useHeartbeat(invitationId, state.invitation?.status, state.invitation?.allowPause);

  useProctoring(
    invitationId,
    state.invitation?.status,
    state.invitation?.allowPause,
    state.violations,
    state.interviewEnded,
    dispatch,
  );

  const isQuestionAnswered = useCallback(
    (questionId: string) =>
      state.invitation?.responses?.some(r => r.questionId === questionId) || false,
    [state.invitation?.responses],
  );

  // Status screens
  if (state.loading) return <LoadingScreen />;
  if (state.error || !state.invitation) return <ErrorScreen error={state.error} />;
  if (state.invitation.status === 'completed' || state.invitation.status === 'expired') {
    return <StatusScreen status={state.invitation.status} />;
  }

  const existingResponse = derived.currentQuestion
    ? state.invitation.responses?.find(r => r.questionId === derived.currentQuestion!.id)
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex flex-col">
      {state.showViolationWarning && (
        <ViolationWarning
          violations={state.violations}
          interviewEnded={state.interviewEnded}
          onDismiss={() => dispatch({ type: 'DISMISS_WARNING' })}
        />
      )}

      <InterviewHeader
        templateTitle={derived.templateTitle}
        companyName={state.invitation.companyName}
        currentQuestionIndex={state.currentQuestionIndex}
        totalQuestions={derived.totalQuestions}
        progressPercent={derived.progressPercent}
        elapsedTime={state.elapsedTime}
        showTimer={state.invitation.showTimer}
        allowPause={state.invitation.allowPause}
        violations={state.violations}
        completing={state.completing}
        questions={derived.questions}
        isQuestionAnswered={isQuestionAnswered}
        onQuestionSelect={goToQuestion}
        onSaveAndExit={handleSaveAndExit}
        onFinishNow={() => handleComplete(true)}
      />

      <div className="flex-1 px-4 sm:px-6 py-6 overflow-auto">
        {derived.currentQuestion && (
          <QuestionCard
            question={derived.currentQuestion}
            questionIndex={state.currentQuestionIndex}
            totalQuestions={derived.totalQuestions}
            isAnswered={derived.currentAnswered}
            existingResponse={existingResponse}
            answers={state.answers}
            submitting={state.submitting}
            completing={state.completing}
            allAnswered={derived.allAnswered}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSubmitAnswer}
            onComplete={() => handleComplete(false)}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />
        )}
      </div>
    </div>
  );
}
