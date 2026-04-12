import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getInvitation,
  submitResponse,
  completeInvitation,
  type SubmitResponseDto,
} from "@/lib/api/invitations";
import { toast } from "sonner";
import type {
  InterviewState,
  InterviewAction,
  DerivedInterviewState,
} from "../_types/interview.types";

export function useInterviewFlow(
  invitationId: string,
  state: InterviewState,
  derived: DerivedInterviewState,
  dispatch: React.Dispatch<InterviewAction>,
) {
  const router = useRouter();

  // Load invitation
  const loadInvitation = useCallback(async () => {
    dispatch({ type: "LOAD_START" });

    try {
      const data = await getInvitation(invitationId, true);

      if (data.status === "completed") {
        toast.info("This interview has already been completed");
      } else if (data.status === "expired") {
        toast.error("This interview has expired");
      } else if (data.status === "pending") {
        toast.error("Interview not started. Please start from dashboard.");
        router.push("/candidate/dashboard");
        return;
      }

      const questions = data.questions || data.template?.questions || [];
      const answeredIds = new Set(
        data.responses?.map((r) => r.questionId) || [],
      );
      const firstUnansweredIdx = questions.findIndex(
        (q) => !answeredIds.has(q.id),
      );

      const startIndex =
        firstUnansweredIdx !== -1
          ? firstUnansweredIdx
          : questions.length > 0
            ? questions.length - 1
            : 0;

      dispatch({ type: "LOAD_SUCCESS", invitation: data, startIndex });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load interview";
      dispatch({ type: "LOAD_ERROR", error: message });
      toast.error(message);
    }
  }, [invitationId, router, dispatch]);

  useEffect(() => {
    loadInvitation();
  }, [loadInvitation]);

  // Answer change
  const handleAnswerChange = useCallback(
    (questionId: string, value: string, type: "text" | "option") => {
      dispatch({
        type: "UPDATE_ANSWER",
        questionId,
        field: type === "text" ? "textAnswer" : "selectedOption",
        value,
        questionStartTime: state.questionStartTime,
      });
    },
    [dispatch, state.questionStartTime],
  );

  // Submit answer
  const handleSubmitAnswer = useCallback(async () => {
    const { currentQuestion, answeredQuestions, totalQuestions } = derived;
    if (!currentQuestion || !state.invitation) return;

    const answer = state.answers[currentQuestion.id];
    if (!answer) {
      toast.error("Please provide an answer");
      return;
    }

    let textAnswer: string | undefined;
    if (currentQuestion.type === "text") {
      textAnswer = answer.textAnswer;
      if (!textAnswer?.trim()) {
        toast.error("Please provide a text answer");
        return;
      }
    } else if (currentQuestion.type === "multiple_choice") {
      textAnswer = answer.selectedOption;
      if (!textAnswer) {
        toast.error("Please select an option");
        return;
      }
    }

    const duration = Math.floor((Date.now() - state.questionStartTime) / 1000);
    const currentIdx = state.currentQuestionIndex;
    const isLastUnanswered = answeredQuestions === totalQuestions - 1;

    dispatch({ type: "SUBMIT_START" });

    try {
      const dto: SubmitResponseDto = {
        questionId: currentQuestion.id,
        questionIndex: currentIdx,
        questionText: currentQuestion.text,
        responseType: "text",
        textAnswer,
        duration,
      };

      await submitResponse(invitationId, dto);
      toast.success("Answer submitted!");

      if (isLastUnanswered) {
        await completeInvitation(invitationId);
        toast.success("Interview completed!");
        router.push("/candidate/dashboard");
        return;
      }

      const updatedInvitation = await getInvitation(invitationId, true);
      const nextIndex =
        currentIdx < totalQuestions - 1 ? currentIdx + 1 : undefined;
      dispatch({
        type: "SUBMIT_SUCCESS",
        invitation: updatedInvitation,
        nextIndex,
      });
    } catch (err) {
      dispatch({ type: "SUBMIT_ERROR" });
      const message =
        err instanceof Error ? err.message : "Failed to submit answer";
      toast.error(message);
    }
  }, [invitationId, state, derived, dispatch, router]);

  // Complete interview
  const handleComplete = useCallback(
    async (force: boolean = false) => {
      if (!state.invitation) return;

      const unansweredCount =
        derived.totalQuestions - derived.answeredQuestions;
      if (!force && unansweredCount > 0) {
        const confirmed = window.confirm(
          `You have ${unansweredCount} unanswered question(s). Unanswered questions will be marked as "No response". Are you sure you want to finish?`,
        );
        if (!confirmed) return;
      }

      // If all answered → manual, if some unanswered → early_finish
      const reason = unansweredCount > 0 ? "early_finish" : "manual";

      dispatch({ type: "COMPLETE_START" });

      try {
        await completeInvitation(invitationId, reason);
        toast.success("Interview completed successfully!");
        router.push("/candidate/dashboard");
      } catch (err) {
        dispatch({ type: "COMPLETE_ERROR" });
        const message =
          err instanceof Error ? err.message : "Failed to complete interview";
        toast.error(message);
      }
    },
    [invitationId, state.invitation, derived, dispatch, router],
  );

  // Navigation
  const goToPrevious = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      dispatch({
        type: "SET_QUESTION_INDEX",
        index: state.currentQuestionIndex - 1,
      });
    }
  }, [state.currentQuestionIndex, dispatch]);

  const goToNext = useCallback(() => {
    if (state.currentQuestionIndex < derived.totalQuestions - 1) {
      dispatch({
        type: "SET_QUESTION_INDEX",
        index: state.currentQuestionIndex + 1,
      });
    }
  }, [state.currentQuestionIndex, derived.totalQuestions, dispatch]);

  const goToQuestion = useCallback(
    (index: number) => {
      dispatch({ type: "SET_QUESTION_INDEX", index });
    },
    [dispatch],
  );

  const handleSaveAndExit = useCallback(() => {
    router.push("/candidate/dashboard");
  }, [router]);

  return {
    handleAnswerChange,
    handleSubmitAnswer,
    handleComplete,
    goToPrevious,
    goToNext,
    goToQuestion,
    handleSaveAndExit,
  };
}
