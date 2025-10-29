"use client";
import { useState } from "react";
import { apiPost } from "../../../lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: 'video' | 'audio' | 'text';
  timeLimit?: number; // seconds
  required: boolean;
}

interface InterviewForm {
  title: string;
  description: string;
  instructions: string;
  questions: Question[];
  settings: {
    allowReRecording: boolean;
    showTimer: boolean;
    randomizeQuestions: boolean;
    collectContactInfo: boolean;
  };
}

export default function CreateInterviewPage() {
  const router = useRouter();
  const [form, setForm] = useState<InterviewForm>({
    title: '',
    description: '',
    instructions: 'Please answer each question thoughtfully. You can re-record your responses if needed.',
    questions: [],
    settings: {
      allowReRecording: true,
      showTimer: true,
      randomizeQuestions: false,
      collectContactInfo: true,
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Questions, 3: Settings, 4: Review

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      type: 'video',
      timeLimit: 120,
      required: true
    };
    setForm({
      ...form,
      questions: [...form.questions, newQuestion]
    });
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setForm({
      ...form,
      questions: form.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    });
  };

  const removeQuestion = (questionId: string) => {
    setForm({
      ...form,
      questions: form.questions.filter(q => q.id !== questionId)
    });
  };

  const handleSubmit = async (asDraft = true) => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with real API call
      // const res = await apiPost("/interviews", {
      //   ...form,
      //   status: asDraft ? 'draft' : 'active'
      // });
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Creating interview:', { ...form, status: asDraft ? 'draft' : 'active' });
      
      // Redirect to interviews list
      router.push('/dashboard/interviews');
    } catch (e: any) {
      setError(e.message || 'Failed to create interview');
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return form.title.trim() && 
           form.description.trim() && 
           form.questions.length > 0 && 
           form.questions.every(q => q.text.trim());
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white mb-6">
        Basic Information
      </h2>
      
      <div className="space-y-2">
        <Label htmlFor="title" className="text-white font-medium">
          Interview Title *
        </Label>
        <Input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => setForm({...form, title: e.target.value})}
          placeholder="e.g. Frontend Developer Interview"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-white font-medium">
          Description *
        </Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({...form, description: e.target.value})}
          placeholder="Brief description of what this interview evaluates"
          rows={3}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions" className="text-white font-medium">
          Instructions for Candidates
        </Label>
        <Textarea
          id="instructions"
          value={form.instructions}
          onChange={(e) => setForm({...form, instructions: e.target.value})}
          placeholder="Instructions that candidates will see before starting"
          rows={4}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
      </div>
    </div>
  );

  const renderQuestions = () => (
    <div style={{ marginBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
          Questions ({form.questions.length})
        </h2>
        <button
          onClick={addQuestion}
          style={{
            background: '#4ade80',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          + Add Question
        </button>
      </div>

      {form.questions.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '40px 20px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '2px dashed rgba(255,255,255,0.3)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}>❓</div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No questions yet</h3>
          <p style={{ opacity: '0.7', marginBottom: '20px' }}>Add your first question to get started</p>
          <button
            onClick={addQuestion}
            style={{
              background: '#ffd700',
              color: '#333',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Add First Question
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {form.questions.map((question, index) => (
            <div
              key={question.id}
              style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                  Question {index + 1}
                </h4>
                <button
                  onClick={() => removeQuestion(question.id)}
                  style={{
                    background: 'rgba(244, 67, 54, 0.8)',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <textarea
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                  placeholder="Enter your question here..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                    Response Type
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) => updateQuestion(question.id, { type: e.target.value as 'video' | 'audio' | 'text' })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  >
                    <option value="video">🎥 Video</option>
                    <option value="audio">🎵 Audio</option>
                    <option value="text">📝 Text</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                    Time Limit (seconds)
                  </label>
                  <input
                    type="number"
                    value={question.timeLimit || 120}
                    onChange={(e) => updateQuestion(question.id, { timeLimit: parseInt(e.target.value) || 120 })}
                    min={30}
                    max={600}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                    />
                    Required
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div style={{ marginBottom: '30px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
        Interview Settings
      </h2>
      
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px' }}>
            <input
              type="checkbox"
              checked={form.settings.allowReRecording}
              onChange={(e) => setForm({
                ...form,
                settings: { ...form.settings, allowReRecording: e.target.checked }
              })}
            />
            <span>Allow candidates to re-record their responses</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px' }}>
            <input
              type="checkbox"
              checked={form.settings.showTimer}
              onChange={(e) => setForm({
                ...form,
                settings: { ...form.settings, showTimer: e.target.checked }
              })}
            />
            <span>Show countdown timer during recording</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px' }}>
            <input
              type="checkbox"
              checked={form.settings.randomizeQuestions}
              onChange={(e) => setForm({
                ...form,
                settings: { ...form.settings, randomizeQuestions: e.target.checked }
              })}
            />
            <span>Randomize question order for each candidate</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px' }}>
            <input
              type="checkbox"
              checked={form.settings.collectContactInfo}
              onChange={(e) => setForm({
                ...form,
                settings: { ...form.settings, collectContactInfo: e.target.checked }
              })}
            />
            <span>Collect candidate contact information</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div style={{ marginBottom: '30px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
        Review & Create
      </h2>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
            Interview Overview
          </h3>
          <div style={{ display: 'grid', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
            <div><strong>Title:</strong> {form.title || 'Untitled Interview'}</div>
            <div><strong>Description:</strong> {form.description || 'No description'}</div>
            <div><strong>Questions:</strong> {form.questions.length} questions</div>
            <div><strong>Estimated Time:</strong> ~{Math.ceil(form.questions.reduce((acc, q) => acc + (q.timeLimit || 120), 0) / 60)} minutes</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
            Questions Preview
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {form.questions.map((question, index) => (
              <div key={question.id} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                  {index + 1}. {question.text || 'Empty question'}
                </div>
                <div style={{ fontSize: '12px', opacity: '0.7' }}>
                  {question.type} • {question.timeLimit}s • {question.required ? 'Required' : 'Optional'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header currentPage="interviews" />

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Create Interview
          </h1>
          <p className="text-lg text-white/80">
            Set up a new video interview with custom questions
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-10">
          <div className="flex justify-center items-center mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                  step <= currentStep
                    ? 'bg-yellow-400 text-gray-900'
                    : 'bg-white/20 text-white'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    step < currentStep ? 'bg-yellow-400' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-white/70">
            {currentStep === 1 && 'Basic Information'}
            {currentStep === 2 && 'Add Questions'}
            {currentStep === 3 && 'Configure Settings'}
            {currentStep === 4 && 'Review & Create'}
          </div>
        </div>

        {/* Form Content */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8">
            {currentStep === 1 && renderBasicInfo()}
            {currentStep === 2 && renderQuestions()}
            {currentStep === 3 && renderSettings()}
            {currentStep === 4 && renderReview()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/20">
              <Button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                variant="glass"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-3">
                {currentStep === 4 ? (
                  <>
                    <Button
                      onClick={() => handleSubmit(true)}
                      disabled={!isFormValid() || loading}
                      variant="glass"
                    >
                      {loading ? 'Creating...' : 'Save as Draft'}
                    </Button>
                    <Button
                      onClick={() => handleSubmit(false)}
                      disabled={!isFormValid() || loading}
                      variant="brand"
                    >
                      {loading ? 'Creating...' : 'Create & Publish'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                    disabled={currentStep === 2 && form.questions.length === 0}
                    variant="brand"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
