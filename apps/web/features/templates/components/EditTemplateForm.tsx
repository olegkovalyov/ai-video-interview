'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { getTemplate, updateTemplate, addQuestion, removeQuestion, reorderQuestions } from '../services/templates-api';
import { Template, QuestionType, QuestionOption } from '../types/template.types';
import { MultipleChoiceOptions } from './CreateTemplateWizard/MultipleChoiceOptions';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EditTemplateFormProps {
  templateId: string;
}

interface SortableQuestionProps {
  question: QuestionFormData;
  index: number;
  onRemove: (id: string) => void;
}

function SortableQuestion({ question, index, onRemove }: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white/5 border border-white/10 rounded-lg p-4 transition-all
        ${isDragging ? 'opacity-50 z-50' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 text-white/40 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-white/50 font-semibold mr-2">#{index + 1}</span>
              <span className="text-white font-medium">{question.text}</span>
            </div>
            <button
              onClick={() => onRemove(question.id)}
              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>Type: {question.type}</span>
            <span>⏱️ {Math.floor(question.timeLimit / 60)} min</span>
            {question.required && <span className="text-yellow-400">★ Required</span>}
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
  );
}

interface QuestionFormData {
  id: string;
  text: string;
  type: QuestionType;
  order: number;
  timeLimit: number;
  required: boolean;
  hints?: string;
  options?: QuestionOption[];
}

export function EditTemplateForm({ templateId }: EditTemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [settings, setSettings] = useState({
    totalTimeLimit: 30,
    allowRetakes: true,
    showTimer: true,
    randomizeQuestions: false,
  });

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<QuestionFormData>>({
    text: '',
    type: 'text',
    timeLimit: 180,
    required: true,
    hints: '',
    options: [],
  });
  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load template
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const template = await getTemplate(templateId);
        
        setTitle(template.title);
        setDescription(template.description);
        setQuestions(template.questions || []);
        setSettings(template.settings || {
          totalTimeLimit: 30,
          allowRetakes: true,
          showTimer: true,
          randomizeQuestions: false,
        });
      } catch (error: any) {
        toast.error(error.message || 'Failed to load template');
        router.push('/hr/interviews');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, router]);

  const handleAddQuestion = async () => {
    if (!newQuestion.text || newQuestion.text.trim().length < 10) {
      toast.error('Question text must be at least 10 characters');
      return;
    }

    if (newQuestion.type === 'multiple_choice') {
      if (!newQuestion.options || newQuestion.options.length < 2) {
        toast.error('Multiple choice questions must have at least 2 answer options');
        return;
      }
      const hasCorrectAnswer = newQuestion.options.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) {
        toast.error('Please mark at least one answer as correct');
        return;
      }
    }

    try {
      // Call API immediately to add question
      const result = await addQuestion(templateId, {
        text: newQuestion.text,
        type: newQuestion.type || 'text',
        order: questions.length + 1,
        timeLimit: newQuestion.timeLimit || 180,
        required: newQuestion.required ?? true,
        hints: newQuestion.hints,
        // Remove 'id' from options - backend generates UUIDs
        options: newQuestion.type === 'multiple_choice' 
          ? newQuestion.options?.map(({ text, isCorrect }) => ({ text, isCorrect }))
          : undefined,
      });

      // Add to state with REAL UUID from backend
      const questionWithId: QuestionFormData = {
        id: result.id, // Real UUID from backend!
        text: newQuestion.text,
        type: newQuestion.type || 'text',
        order: questions.length + 1,
        timeLimit: newQuestion.timeLimit || 180,
        required: newQuestion.required ?? true,
        hints: newQuestion.hints,
        options: newQuestion.options,
      };

      setQuestions([...questions, questionWithId]);
      
      setNewQuestion({
        text: '',
        type: 'text',
        timeLimit: 180,
        required: true,
        hints: '',
        options: [],
      });
      setShowAddQuestion(false);
      toast.success('Question added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add question');
    }
  };

  const handleRemoveQuestion = async (id: string) => {
    try {
      // Call API immediately to remove question
      await removeQuestion(templateId, id);
      
      // Update state
      setQuestions(questions.filter(q => q.id !== id));
      toast.success('Question removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove question');
    }
  };

  // Drag & Drop with dnd-kit
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex(q => q.id === active.id);
    const newIndex = questions.findIndex(q => q.id === over.id);

    const reordered = arrayMove(questions, oldIndex, newIndex).map((q, idx) => ({
      ...q,
      order: idx + 1,
    }));

    // Update state immediately for UI
    setQuestions(reordered);

    try {
      // Call API to persist new order
      await reorderQuestions(templateId, {
        questionIds: reordered.map(q => q.id),
      });
    } catch (error: any) {
      // Revert on error
      toast.error(error.message || 'Failed to reorder questions');
      setQuestions(questions); // Revert to original order
    }
  };

  const handleSave = async () => {
    if (title.trim().length < 3) {
      toast.error('Title must be at least 3 characters');
      return;
    }
    if (description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }
    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    setIsSubmitting(true);
    try {
      // Only update template metadata (questions already saved via API calls)
      await updateTemplate(templateId, {
        title,
        description,
        settings,
      });

      toast.success('Template updated successfully');
      router.push('/hr/interviews');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update template');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
        <div className="text-white text-center py-12">Loading template...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/hr/interviews')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-2xl font-bold text-white">Edit Template</h2>
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">
              Template Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g., Senior Frontend Developer Interview"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              placeholder="Describe the purpose and scope of this interview template..."
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Questions ({questions.length})
        </h3>

        {questions.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3 mb-4">
                {questions.map((question, index) => (
                  <SortableQuestion
                    key={question.id}
                    question={question}
                    index={index}
                    onRemove={handleRemoveQuestion}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Add Question Form */}
        {showAddQuestion ? (
          <div className="bg-white/5 border border-blue-500/30 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">
                Question Text <span className="text-red-400">*</span>
              </label>
              <textarea
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                rows={3}
                placeholder="Enter your interview question..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Question Type</label>
                <select
                  value={newQuestion.type}
                  onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as QuestionType, options: [] })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
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
                  value={newQuestion.timeLimit}
                  onChange={(e) => setNewQuestion({ ...newQuestion, timeLimit: parseInt(e.target.value) || 180 })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Hints (optional)</label>
              <input
                type="text"
                value={newQuestion.hints}
                onChange={(e) => setNewQuestion({ ...newQuestion, hints: e.target.value })}
                placeholder="Focus on real-world examples..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {newQuestion.type === 'multiple_choice' && (
              <MultipleChoiceOptions
                options={newQuestion.options || []}
                onChange={(options) => setNewQuestion({ ...newQuestion, options })}
              />
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={newQuestion.required}
                onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
                className="w-4 h-4 rounded bg-white/10 border-white/20"
              />
              <label htmlFor="required" className="text-white cursor-pointer">
                This question is required
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAddQuestion}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Add Question
              </button>
              <button
                onClick={() => setShowAddQuestion(false)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddQuestion(true)}
            className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-blue-500/50 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Add Question
          </button>
        )}
      </div>

      {/* Settings */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Interview Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">
              Total Time Limit (minutes)
            </label>
            <input
              type="number"
              value={settings.totalTimeLimit}
              onChange={(e) => setSettings({ ...settings, totalTimeLimit: parseInt(e.target.value) || 30 })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="showTimer"
                checked={settings.showTimer}
                onChange={(e) => setSettings({ ...settings, showTimer: e.target.checked })}
                className="mt-1 w-4 h-4 rounded bg-white/10 border-white/20"
              />
              <div>
                <label htmlFor="showTimer" className="text-white font-medium cursor-pointer">
                  Show timer to candidates
                </label>
                <p className="text-sm text-white/50">
                  Display a countdown timer during the interview
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="allowRetakes"
                checked={settings.allowRetakes}
                onChange={(e) => setSettings({ ...settings, allowRetakes: e.target.checked })}
                className="mt-1 w-4 h-4 rounded bg-white/10 border-white/20"
              />
              <div>
                <label htmlFor="allowRetakes" className="text-white font-medium cursor-pointer">
                  Allow retakes
                </label>
                <p className="text-sm text-white/50">
                  Candidates can re-record their answers
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="randomizeQuestions"
                checked={settings.randomizeQuestions}
                onChange={(e) => setSettings({ ...settings, randomizeQuestions: e.target.checked })}
                className="mt-1 w-4 h-4 rounded bg-white/10 border-white/20"
              />
              <div>
                <label htmlFor="randomizeQuestions" className="text-white font-medium cursor-pointer">
                  Randomize question order
                </label>
                <p className="text-sm text-white/50">
                  Questions will appear in random order for each candidate
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
