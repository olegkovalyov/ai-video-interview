import { useState, useEffect, useRef } from 'react';
import { Trash2, Edit2, GripVertical, Plus, Video, FileText, CheckSquare } from 'lucide-react';
import { QuestionType, QuestionOption } from '../../types/template.types';
import { MultipleChoiceOptions } from './MultipleChoiceOptions';
import { addQuestion, removeQuestion } from '../../services/templates-api';
import { toast } from 'sonner';

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  order: number;
  timeLimit: number;
  required: boolean;
  hints?: string;
  options?: QuestionOption[];
}

interface Step2QuestionsProps {
  templateId: string | null;
  data: {
    questions: Question[];
  };
  onDataChange: (data: { questions: Question[] }) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function Step2Questions({
  templateId,
  data,
  onDataChange,
  onValidationChange,
}: Step2QuestionsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<Partial<Question>>({
    text: '',
    type: 'text',
    timeLimit: 180,
    required: true,
    hints: '',
    options: [],
  });
  const prevValidRef = useRef<boolean | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Validate questions count on change
  useEffect(() => {
    const isValid = data.questions.length > 0;
    if (prevValidRef.current !== isValid) {
      prevValidRef.current = isValid;
      onValidationChange(isValid);
    }
  }, [data.questions.length, onValidationChange]);

  const handleAddQuestion = async () => {
    if (!formData.text || formData.text.trim().length < 10) {
      toast.error('Question text must be at least 10 characters');
      return;
    }

    if (!templateId) {
      toast.error('Template ID is missing');
      return;
    }

    // Validate multiple choice questions
    if (formData.type === 'multiple_choice') {
      if (!formData.options || formData.options.length < 2) {
        toast.error('Multiple choice questions must have at least 2 answer options');
        return;
      }
      const hasCorrectAnswer = formData.options.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) {
        toast.error('Please mark at least one answer as correct');
        return;
      }
    }

    try {
      // ✅ REAL API: Add question
      const response = await addQuestion(templateId, {
        text: formData.text,
        type: formData.type || 'video',
        order: data.questions.length + 1,
        timeLimit: formData.timeLimit || 180,
        required: formData.required ?? true,
        hints: formData.hints,
        // ✅ Send options for multiple_choice questions (remove 'id' field)
        options: formData.type === 'multiple_choice' 
          ? formData.options?.map(({ text, isCorrect }) => ({ text, isCorrect }))
          : undefined,
      });

      // Update local state with server-generated ID
      const newQuestion: Question = {
        id: response.id, // ✅ Real UUID from server!
        text: formData.text,
        type: formData.type || 'video',
        order: data.questions.length + 1,
        timeLimit: formData.timeLimit || 180,
        required: formData.required ?? true,
        hints: formData.hints,
        // ✅ Generate temporary IDs for options on client-side
        options: formData.type === 'multiple_choice' 
          ? formData.options?.map((opt, idx) => ({
              id: `${response.id}-opt-${idx}`, // Temporary ID
              text: opt.text,
              isCorrect: opt.isCorrect,
            }))
          : undefined,
      };

      onDataChange({ questions: [...data.questions, newQuestion] });

      console.log('✅ Question added (ID:', response.id, ')');
      toast.success('Question added');

      // Reset form
      setFormData({
        text: '',
        type: 'text',
        timeLimit: 180,
        required: true,
        hints: '',
        options: [],
      });
      setShowAddForm(false);

    } catch (error: any) {
      console.error('🔴 Error adding question:', error);
      const errorMessage = error?.message || 'Failed to add question. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleRemoveQuestion = async (id: string) => {
    if (!templateId) {
      toast.error('Template ID is missing');
      return;
    }

    try {
      // ✅ REAL API: Remove question
      await removeQuestion(templateId, id);

      // Update local state
      const updated = data.questions.filter((q) => q.id !== id);
      onDataChange({ questions: updated });

      console.log('✅ Question removed (ID:', id, ')');
      toast.success('Question removed');

    } catch (error: any) {
      console.error('🔴 Error removing question:', error);
      const errorMessage = error?.message || 'Failed to remove question. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...data.questions];
    const draggedItem = newQuestions[draggedIndex];
    
    if (!draggedItem) return; // Safety check
    
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);
    
    // Update order numbers
    const reordered = newQuestions.map((q, idx) => ({
      ...q,
      order: idx + 1,
    }));
    
    onDataChange({ questions: reordered });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'multiple_choice':
        return <CheckSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Questions List */}
      {data.questions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-lg">
            Questions ({data.questions.length})
          </h3>
          {data.questions.map((question, index) => (
            <div
              key={question.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                bg-white/5 backdrop-blur-md border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all
                ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <div className="mt-1 text-white/40 cursor-move">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Question Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white/50 font-semibold">#{index + 1}</span>
                      <h4 className="text-white font-medium">{question.text}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveQuestion(question.id)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      {getQuestionTypeIcon(question.type)}
                      <span className="capitalize">{question.type}</span>
                    </div>
                    <span>⏱️ {Math.floor(question.timeLimit / 60)} min</span>
                    {question.required && (
                      <span className="text-yellow-400">★ Required</span>
                    )}
                  </div>

                  {question.hints && (
                    <p className="mt-2 text-sm text-white/50 italic">💡 {question.hints}</p>
                  )}
                  
                  {question.type === 'multiple_choice' && question.options && (
                    <div className="mt-3 space-y-1">
                      {question.options.map((opt, idx) => (
                        <div key={opt.id} className="flex items-center gap-2 text-sm">
                          <span className={opt.isCorrect ? 'text-green-400' : 'text-white/50'}>
                            {String.fromCharCode(65 + idx)}) {opt.text}
                            {opt.isCorrect && ' ✓'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Question Form */}
      {showAddForm ? (
        <div className="bg-white/5 backdrop-blur-md border border-blue-500/30 rounded-lg p-6 space-y-4">
          <h3 className="text-white font-semibold text-lg mb-4">Add Question</h3>

          {/* Question Text */}
          <div>
            <label className="block text-white font-medium mb-2">
              Question Text <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="e.g., Describe your experience with React..."
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          {/* Type & Time Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Question Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as QuestionType })
                }
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="text">Text Response</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="video" disabled className="text-white/30">Video Response (Coming Soon)</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Time Limit (seconds)</label>
              <input
                type="number"
                value={formData.timeLimit}
                onChange={(e) =>
                  setFormData({ ...formData, timeLimit: parseInt(e.target.value) })
                }
                min={30}
                max={600}
                step={30}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Hints */}
          <div>
            <label className="block text-white font-medium mb-2">
              Hints (optional)
            </label>
            <input
              type="text"
              value={formData.hints}
              onChange={(e) => setFormData({ ...formData, hints: e.target.value })}
              placeholder="Focus on real-world examples..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Multiple Choice Options */}
          {formData.type === 'multiple_choice' && (
            <MultipleChoiceOptions
              options={formData.options || []}
              onChange={(options) => setFormData({ ...formData, options })}
            />
          )}

          {/* Required Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={formData.required}
              onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
              className="w-4 h-4 rounded bg-white/10 border-white/20"
            />
            <label htmlFor="required" className="text-white">
              This question is required
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddQuestion}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Add Question
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-blue-500/50 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      )}

      {/* Help */}
      {data.questions.length === 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <p className="text-sm text-orange-200">
            <strong>⚠️ Note:</strong> You need to add at least one question to proceed to the next step.
          </p>
        </div>
      )}
    </div>
  );
}
