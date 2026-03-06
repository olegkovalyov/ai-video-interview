import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
} from 'lucide-react';
import type { Question, InvitationResponse } from '@/lib/api/invitations';
import type { AnswerState } from '../_types/interview.types';

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  isAnswered: boolean;
  existingResponse?: InvitationResponse;
  answers: AnswerState;
  submitting: boolean;
  completing: boolean;
  allAnswered: boolean;
  onAnswerChange: (questionId: string, value: string, type: 'text' | 'option') => void;
  onSubmit: () => void;
  onComplete: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  isAnswered,
  existingResponse,
  answers,
  submitting,
  completing,
  allAnswered,
  onAnswerChange,
  onSubmit,
  onComplete,
  onPrevious,
  onNext,
}: QuestionCardProps) {
  const typeLabel = question.type === 'text'
    ? 'Text Answer'
    : question.type === 'multiple_choice'
      ? 'Multiple Choice'
      : 'Video';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
        {/* Question Header */}
        <div className="px-6 py-4 bg-white/5 flex items-center justify-between">
          <span className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-sm">
            {typeLabel}
          </span>
          {question.required && (
            <span className="text-yellow-400 text-sm font-medium">Required</span>
          )}
        </div>

        {/* Question Body */}
        <div className="p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 leading-relaxed">
            {question.text}
          </h2>

          {question.hints && (
            <p className="text-white/60 text-sm mb-6 italic bg-white/5 px-4 py-2 rounded-lg">
              Hint: {question.hints}
            </p>
          )}

          {/* Answer Section */}
          {isAnswered ? (
            <AnsweredView response={existingResponse} />
          ) : (
            <AnswerInput
              question={question}
              answers={answers}
              onAnswerChange={onAnswerChange}
            />
          )}
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={onPrevious}
            disabled={questionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-3">
            {!isAnswered && question.type !== 'video' && (
              <button
                onClick={onSubmit}
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
                onClick={onComplete}
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
            onClick={onNext}
            disabled={questionIndex === totalQuestions - 1}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AnsweredView({ response }: { response?: InvitationResponse }) {
  return (
    <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 text-green-300 mb-2">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Question answered</span>
      </div>
      {response?.textAnswer && (
        <p className="text-white/80 bg-white/5 p-3 rounded-lg mt-2">
          {response.textAnswer}
        </p>
      )}
    </div>
  );
}

function AnswerInput({
  question,
  answers,
  onAnswerChange,
}: {
  question: Question;
  answers: AnswerState;
  onAnswerChange: (questionId: string, value: string, type: 'text' | 'option') => void;
}) {
  if (question.type === 'text') {
    return (
      <textarea
        value={answers[question.id]?.textAnswer || ''}
        onChange={(e) => onAnswerChange(question.id, e.target.value, 'text')}
        placeholder="Type your answer here..."
        aria-label="Your answer"
        className="w-full h-40 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
      />
    );
  }

  if (question.type === 'multiple_choice' && question.options) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option, idx) => {
          const isSelected = answers[question.id]?.selectedOption === option.text;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onAnswerChange(question.id, option.text, 'option')}
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
    );
  }

  if (question.type === 'video') {
    return (
      <div className="bg-white/5 border border-white/20 rounded-xl p-8 text-center">
        <p className="text-white/60">Video recording coming soon</p>
      </div>
    );
  }

  return null;
}
