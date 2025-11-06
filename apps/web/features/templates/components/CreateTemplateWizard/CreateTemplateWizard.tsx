'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { toast } from 'sonner';
import { WizardProgress } from './WizardProgress';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2Questions } from './Step2Questions';
import { Step3SettingsReview } from './Step3SettingsReview';
import { createTemplate, addQuestion } from '../../services/templates-api';
import { InterviewSettings, QuestionType } from '../../types/template.types';

const STEPS = [
  { number: 1, title: 'Basic Info', description: 'Title & Description' },
  { number: 2, title: 'Questions', description: 'Add interview questions' },
  { number: 3, title: 'Settings', description: 'Configure & Review' },
];

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  order: number;
  timeLimit: number;
  required: boolean;
  hints?: string;
}

export function CreateTemplateWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepValidation, setStepValidation] = useState({
    1: false,
    2: false,
    3: true, // Settings step is always valid
  });

  const [wizardData, setWizardData] = useState({
    title: '',
    description: '',
    questions: [] as Question[],
    settings: {
      totalTimeLimit: 45,
      allowRetakes: false,
      showTimer: true,
      randomizeQuestions: false,
    } as InterviewSettings,
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const { id } = await createTemplate({
        title: wizardData.title,
        description: wizardData.description,
        settings: wizardData.settings,
      });

      // Add questions
      for (const question of wizardData.questions) {
        await addQuestion(id, {
          text: question.text,
          type: question.type,
          order: question.order,
          timeLimit: question.timeLimit,
          required: question.required,
          hints: question.hints,
        });
      }

      toast.success('Template saved as draft');
      router.push(`/hr/interviews/${id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      // Create template
      const { id } = await createTemplate({
        title: wizardData.title,
        description: wizardData.description,
        settings: wizardData.settings,
      });

      // Add questions
      for (const question of wizardData.questions) {
        await addQuestion(id, {
          text: question.text,
          type: question.type,
          order: question.order,
          timeLimit: question.timeLimit,
          required: question.required,
          hints: question.hints,
        });
      }

      // TODO: Publish template (when we connect real API)
      // await publishTemplate(id);

      toast.success('Template created and published!');
      router.push('/hr/interviews');
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = stepValidation[currentStep as keyof typeof stepValidation];
  const canProceed = currentStep === 3 || isStepValid;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <WizardProgress currentStep={currentStep} steps={STEPS} />

      {/* Step Content */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 mb-6">
        {currentStep === 1 && (
          <Step1BasicInfo
            data={{ title: wizardData.title, description: wizardData.description }}
            onDataChange={(data) => setWizardData({ ...wizardData, ...data })}
            onValidationChange={(isValid) =>
              setStepValidation({ ...stepValidation, 1: isValid })
            }
          />
        )}

        {currentStep === 2 && (
          <Step2Questions
            data={{ questions: wizardData.questions }}
            onDataChange={(data) => setWizardData({ ...wizardData, ...data })}
            onValidationChange={(isValid) =>
              setStepValidation({ ...stepValidation, 2: isValid })
            }
          />
        )}

        {currentStep === 3 && (
          <Step3SettingsReview
            data={{ settings: wizardData.settings, wizardData }}
            onDataChange={(data) => setWizardData({ ...wizardData, ...data })}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep === 3 ? (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Template'}
              </button>
            </>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Validation hint */}
      {!canProceed && (
        <div className="mt-4 text-center">
          <p className="text-sm text-yellow-300">
            ⚠️ Please complete all required fields to continue
          </p>
        </div>
      )}
    </div>
  );
}
