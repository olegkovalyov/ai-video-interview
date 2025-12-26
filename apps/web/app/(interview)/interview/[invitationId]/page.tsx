'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getInvitation, 
  submitResponse, 
  completeInvitation, 
  sendHeartbeat,
  InvitationWithDetails,
  Question,
  SubmitResponseDto,
} from '@/lib/api/invitations';
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send,
  Home,
  AlertTriangle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface AnswerState {
  [questionId: string]: {
    textAnswer?: string;
    selectedOption?: string;
    duration: number;
  };
}

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.invitationId as string;

  const [invitation, setInvitation] = useState<InvitationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Soft proctoring state
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const MAX_VIOLATIONS = 3;
  const lastViolationTimeRef = useRef<number>(0);
  
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Derived state
  const questions = invitation?.questions || invitation?.template?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const templateTitle = invitation?.templateTitle || invitation?.template?.title || 'Interview';
  const answeredQuestions = invitation?.responses?.length || 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const isQuestionAnswered = useCallback((questionId: string) => {
    return invitation?.responses?.some(r => r.questionId === questionId) || false;
  }, [invitation?.responses]);

  // Load invitation
  const loadInvitation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInvitation(invitationId, true);
      setInvitation(data);
      
      if (data.status === 'completed') {
        toast.info('This interview has already been completed');
      } else if (data.status === 'expired') {
        toast.error('This interview has expired');
      } else if (data.status === 'pending') {
        toast.error('Interview not started. Please start from dashboard.');
        router.push('/candidate/dashboard');
        return;
      }
      
      // Find first unanswered question
      const questions = data.questions || data.template?.questions || [];
      const answeredIds = new Set(data.responses?.map(r => r.questionId) || []);
      const firstUnansweredIdx = questions.findIndex(q => !answeredIds.has(q.id));
      
      if (firstUnansweredIdx !== -1) {
        setCurrentQuestionIndex(firstUnansweredIdx);
      } else if (questions.length > 0) {
        setCurrentQuestionIndex(questions.length - 1);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load interview';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [invitationId, router]);

  useEffect(() => {
    loadInvitation();
  }, [loadInvitation]);

  // Heartbeat
  useEffect(() => {
    if (invitation?.status === 'in_progress' && !invitation?.allowPause) {
      heartbeatIntervalRef.current = setInterval(() => {
        sendHeartbeat(invitationId).catch(console.error);
      }, 30000);
    }
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [invitation?.status, invitation?.allowPause, invitationId]);

  // Timer
  useEffect(() => {
    if (invitation?.showTimer && invitation?.status === 'in_progress') {
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [invitation?.showTimer, invitation?.status]);

  // Question start time
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  // Soft Proctoring: visibility change detection
  // Only active when allowPause=false (strict mode)
  useEffect(() => {
    // Skip if allowPause is enabled - no proctoring in pause mode
    if (invitation?.allowPause) return;
    if (invitation?.status !== 'in_progress' || interviewEnded) return;

    const recordViolation = () => {
      const now = Date.now();
      // Debounce: ignore if less than 1000ms since last violation
      if (now - lastViolationTimeRef.current < 1000) return;
      lastViolationTimeRef.current = now;

      setViolations(prev => {
        if (prev >= MAX_VIOLATIONS) return prev;
        return prev + 1;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) recordViolation();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [invitation?.status, invitation?.allowPause, interviewEnded]);

  // Handle violations side-effects in separate useEffect (proper React pattern)
  useEffect(() => {
    if (invitation?.allowPause) return; // No proctoring if pause allowed
    
    if (violations > 0 && violations < MAX_VIOLATIONS) {
      // Show warning for violations 1 and 2
      setShowViolationWarning(true);
    } else if (violations >= MAX_VIOLATIONS && !interviewEnded) {
      // At max violations - end interview
      setInterviewEnded(true);
      setShowViolationWarning(true); // Show final modal
    }
  }, [violations, invitation?.allowPause, interviewEnded]);

  // Handle interview completion when ended by violations
  useEffect(() => {
    if (interviewEnded && violations >= MAX_VIOLATIONS) {
      // Delay to show the final modal, then complete and redirect
      const timer = setTimeout(async () => {
        try {
          await completeInvitation(invitationId);
          router.push('/candidate/dashboard');
        } catch (err) {
          console.error('Failed to complete interview:', err);
          router.push('/candidate/dashboard');
        }
      }, 3000); // 3 seconds to read the message
      
      return () => clearTimeout(timer);
    }
  }, [interviewEnded, violations, invitationId, router]);

  // beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (invitation?.status === 'in_progress') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [invitation?.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, value: string, type: 'text' | 'option') => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [type === 'text' ? 'textAnswer' : 'selectedOption']: value,
        duration: Math.floor((Date.now() - questionStartTime) / 1000),
      },
    }));
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !invitation) return;

    const answer = answers[currentQuestion.id];
    if (!answer) {
      toast.error('Please provide an answer');
      return;
    }

    const duration = Math.floor((Date.now() - questionStartTime) / 1000);
    
    let textAnswer: string | undefined;
    if (currentQuestion.type === 'text') {
      textAnswer = answer.textAnswer;
      if (!textAnswer?.trim()) {
        toast.error('Please provide a text answer');
        return;
      }
    } else if (currentQuestion.type === 'multiple_choice') {
      textAnswer = answer.selectedOption;
      if (!textAnswer) {
        toast.error('Please select an option');
        return;
      }
    }

    const currentIdx = currentQuestionIndex;
    const isLastUnanswered = answeredQuestions === totalQuestions - 1;

    try {
      setSubmitting(true);
      
      const dto: SubmitResponseDto = {
        questionId: currentQuestion.id,
        questionIndex: currentIdx,
        questionText: currentQuestion.text,
        responseType: 'text',
        textAnswer,
        duration,
      };

      await submitResponse(invitationId, dto);
      toast.success('Answer submitted!');
      
      if (isLastUnanswered) {
        await completeInvitation(invitationId);
        toast.success('Interview completed!');
        router.push('/candidate/dashboard');
        return;
      }
      
      const updatedInvitation = await getInvitation(invitationId, true);
      setInvitation(updatedInvitation);
      
      if (currentIdx < totalQuestions - 1) {
        setCurrentQuestionIndex(currentIdx + 1);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit answer';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (force: boolean = false) => {
    if (!invitation) return;

    const unansweredCount = totalQuestions - answeredQuestions;
    
    if (!force && unansweredCount > 0) {
      const confirmed = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to finish the interview?`
      );
      if (!confirmed) return;
    }

    try {
      setCompleting(true);
      await completeInvitation(invitationId);
      toast.success('Interview completed successfully!');
      router.push('/candidate/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete interview';
      toast.error(message);
    } finally {
      setCompleting(false);
    }
  };

  const handleSaveAndExit = () => {
    router.push('/candidate/dashboard');
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading interview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center max-w-md border border-white/20">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-white/70 mb-6">{error || 'Failed to load interview'}</p>
          <Link 
            href="/candidate/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Completed state
  if (invitation.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center max-w-md border border-white/20">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Interview Completed</h2>
          <p className="text-white/70 mb-6">You have successfully completed this interview.</p>
          <Link 
            href="/candidate/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Expired state
  if (invitation.status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center max-w-md border border-white/20">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Interview Expired</h2>
          <p className="text-white/70 mb-6">This interview has expired and can no longer be taken.</p>
          <Link 
            href="/candidate/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const allAnswered = answeredQuestions >= totalQuestions;
  const currentAnswered = currentQuestion ? isQuestionAnswered(currentQuestion.id) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex flex-col">
      {/* Violation Warning Modal */}
      {showViolationWarning && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-md mx-4 border ${
            interviewEnded ? 'border-red-500/50' : 'border-amber-500/50'
          }`}>
            {interviewEnded ? (
              <>
                <div className="flex items-center gap-3 text-red-400 mb-4">
                  <AlertCircle className="w-8 h-8" />
                  <h3 className="text-xl font-bold text-white">Interview Ended</h3>
                </div>
                <p className="text-white/90 mb-2">
                  You have exceeded the maximum number of violations.
                </p>
                <p className="text-white/70 text-sm mb-4">
                  Your interview has been automatically completed. You will be redirected to your dashboard in a few seconds...
                </p>
                <div className="w-full py-3 bg-red-500/50 text-white font-medium rounded-lg text-center">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Redirecting...
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 text-amber-400 mb-4">
                  <AlertTriangle className="w-8 h-8" />
                  <h3 className="text-xl font-bold text-white">Focus Lost</h3>
                </div>
                <p className="text-white/90 mb-2">
                  You switched away from the interview window.
                </p>
                <p className="text-white/70 text-sm mb-4">
                  Violation {violations} of {MAX_VIOLATIONS}. After {MAX_VIOLATIONS} violations, the interview will end automatically.
                </p>
                <button
                  onClick={() => setShowViolationWarning(false)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Return to Interview
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-white truncate">{templateTitle}</h1>
              <p className="text-white/60 text-sm truncate">{invitation.companyName}</p>
            </div>
            
            {/* Center: Progress */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-center">
                <p className="text-white font-medium">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-white/60 text-xs">{progressPercent}%</span>
                </div>
              </div>
            </div>
            
            {/* Right: Timer & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {invitation.showTimer && (
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                  <span className="text-white font-mono text-sm">{formatTime(elapsedTime)}</span>
                </div>
              )}
              
              {/* Only show violations if proctoring is active (allowPause=false) */}
              {!invitation.allowPause && violations > 0 && (
                <div className="hidden sm:flex items-center gap-1 text-amber-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{violations}/{MAX_VIOLATIONS}</span>
                </div>
              )}
              
              {invitation.allowPause && (
                <button
                  onClick={handleSaveAndExit}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors cursor-pointer"
                >
                  Save & Exit
                </button>
              )}
              <button
                onClick={() => handleComplete(true)}
                disabled={completing}
                className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {completing ? 'Finishing...' : 'Finish Now'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Sticky Question Navigator */}
        <div className="px-4 sm:px-6 py-2 bg-white/5 border-t border-white/10 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max justify-center">
            {questions.map((q, idx) => {
              const answered = isQuestionAnswered(q.id);
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-yellow-400 text-white ring-2 ring-yellow-300 ring-offset-2 ring-offset-purple-600'
                      : answered
                      ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-6 overflow-auto">
        {currentQuestion && (
          <div className="max-w-3xl mx-auto">
            {/* Question Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
              {/* Question Header */}
              <div className="px-6 py-4 bg-white/5 flex items-center justify-between">
                <span className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-sm">
                  {currentQuestion.type === 'text' ? 'Text Answer' : 
                   currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'Video'}
                </span>
                {currentQuestion.required && (
                  <span className="text-yellow-400 text-sm font-medium">Required</span>
                )}
              </div>
              
              {/* Question Body */}
              <div className="p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 leading-relaxed">
                  {currentQuestion.text}
                </h2>
                
                {currentQuestion.hints && (
                  <p className="text-white/60 text-sm mb-6 italic bg-white/5 px-4 py-2 rounded-lg">
                    💡 Hint: {currentQuestion.hints}
                  </p>
                )}
                
                {/* Answer Section */}
                {currentAnswered ? (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-300 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Question answered</span>
                    </div>
                    {invitation.responses?.find(r => r.questionId === currentQuestion.id)?.textAnswer && (
                      <p className="text-white/80 bg-white/5 p-3 rounded-lg mt-2">
                        {invitation.responses.find(r => r.questionId === currentQuestion.id)?.textAnswer}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {currentQuestion.type === 'text' && (
                      <textarea
                        value={answers[currentQuestion.id]?.textAnswer || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, 'text')}
                        placeholder="Type your answer here..."
                        className="w-full h-40 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                      />
                    )}
                    
                    {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {currentQuestion.options.map((option, idx) => {
                          const isSelected = answers[currentQuestion.id]?.selectedOption === option.text;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAnswerChange(currentQuestion.id, option.text, 'option')}
                              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-yellow-500/20 border-yellow-400 shadow-lg shadow-yellow-500/20'
                                  : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                  isSelected ? 'border-yellow-400 bg-yellow-400' : 'border-white/40'
                                }`}>
                                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                </div>
                                <span className={`text-base ${isSelected ? 'text-white font-medium' : 'text-white/80'}`}>
                                  {option.text}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {currentQuestion.type === 'video' && (
                      <div className="bg-white/5 border border-white/20 rounded-xl p-8 text-center">
                        <p className="text-white/60">Video recording coming soon</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Question Footer - Navigation */}
              <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={goToPrevious}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center gap-3">
                  {!currentAnswered && currentQuestion.type !== 'video' && (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit
                        </>
                      )}
                    </button>
                  )}
                  
                  {allAnswered && (
                    <button
                      onClick={() => handleComplete(false)}
                      disabled={completing}
                      className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      {completing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Complete</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={goToNext}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
