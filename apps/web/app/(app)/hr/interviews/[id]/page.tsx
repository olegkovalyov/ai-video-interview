'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Calendar, FileText, Settings } from 'lucide-react';
import { getTemplate } from '@/features/templates/services/templates-api';
import { TemplateStatusBadge } from '@/features/templates/components/TemplateStatusBadge';
import { Template } from '@/features/templates/types/template.types';
import { formatDate } from '@/features/templates/utils/template-helpers';

interface TemplateDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const data = await getTemplate(id);
        setTemplate(data);
      } catch (error) {
        console.error('Failed to load template:', error);
        router.push('/hr/interviews');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
        <main className="container mx-auto px-6 py-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
            <div className="text-white text-center">Loading template...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/hr/interviews')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{template.title}</h1>
              <div className="flex items-center gap-3">
                <TemplateStatusBadge status={template.status} />
                <span className="text-white/60">
                  {template.questionsCount} {template.questionsCount === 1 ? 'question' : 'questions'}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => router.push(`/hr/interviews/${id}/edit`)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            Edit Template
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-white" />
                <h2 className="text-xl font-bold text-white">Description</h2>
              </div>
              <p className="text-white/80">{template.description}</p>
            </div>

            {/* Questions */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-white" />
                <h2 className="text-xl font-bold text-white">Questions ({template.questions?.length || 0})</h2>
              </div>
              
              {template.questions && template.questions.length > 0 ? (
                <div className="space-y-3">
                  {template.questions.map((question, index) => (
                    <div key={question.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-start gap-3">
                        <span className="text-white/50 font-semibold">#{index + 1}</span>
                        <div className="flex-1">
                          <p className="text-white font-medium mb-2">{question.text}</p>
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
                  ))}
                </div>
              ) : (
                <p className="text-white/50">No questions added yet</p>
              )}
            </div>

            {/* Settings */}
            {template.settings && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-white" />
                  <h2 className="text-xl font-bold text-white">Interview Settings</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-white/60 text-sm">Total Time Limit</span>
                    <p className="text-white font-semibold">{template.settings.totalTimeLimit} minutes</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Allow Retakes</span>
                    <p className="text-white font-semibold">{template.settings.allowRetakes ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Show Timer</span>
                    <p className="text-white font-semibold">{template.settings.showTimer ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Randomize Questions</span>
                    <p className="text-white font-semibold">{template.settings.randomizeQuestions ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Meta Info */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Template Info</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-white/60 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-sm">Created</p>
                    <p className="text-white">{formatDate(template.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-white/60 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-sm">Last Updated</p>
                    <p className="text-white">{formatDate(template.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
