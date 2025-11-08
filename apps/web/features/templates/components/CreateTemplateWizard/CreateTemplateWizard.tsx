'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { WizardProgress } from './WizardProgress';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2Questions } from './Step2Questions';
import { Step3SettingsReview } from './Step3SettingsReview';
import { createTemplate, updateTemplate, publishTemplate } from '../../services/templates-api';

export function CreateTemplateWizard() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string | null>(null);
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
    questions: [] as any[],
    settings: {
      totalTimeLimit: 30,
      allowRetakes: true,
      showTimer: true,
      randomizeQuestions: false,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // STEP 1: Create Template (только создание!)
  // ═══════════════════════════════════════════════════════════

  const handleStep1Next = async () => {
    setIsSubmitting(true);
    try {
      // ✅ REAL API: Create template
      const response = await createTemplate({
        title: wizardData.title,
        description: wizardData.description,
        settings: wizardData.settings
      });
      
      setTemplateId(response.id);
      setCurrentStep(2);
      
      toast.success('Template created as draft');
      
    } catch (error: any) {
      console.error('🔴 Error creating template:', error);
      const errorMessage = error?.message || 'Failed to create template. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // STEP 2: Just navigate (questions handled in Step2Questions)
  // ═══════════════════════════════════════════════════════════

  const handleStep2Next = () => {
    console.log('╔════════════════════════════════════════════════════════');
    console.log('║ ℹ️  Step 2 → Step 3: No API call');
    console.log('║ Questions already added via Step2Questions component');
    console.log('╚════════════════════════════════════════════════════════');
    setCurrentStep(3);
  };

  // ═══════════════════════════════════════════════════════════
  // STEP 3: Publish or Save Draft
  // ═══════════════════════════════════════════════════════════

  const handlePublish = async () => {
    if (!templateId) return;
    
    setIsSubmitting(true);
    try {
      // 1. Update settings
      await updateTemplate(templateId, {
        settings: wizardData.settings
      });
      
      // 2. Publish
      await publishTemplate(templateId);
      
      toast.success('Template published!');
      
      console.log('✅ Template published successfully!');
      console.log('   Template ID:', templateId);
      console.log('   Total questions:', wizardData.questions.length);
      
      router.push('/hr/interviews');
      
    } catch (error: any) {
      console.error('🔴 Error publishing template:', error);
      const errorMessage = error?.message || 'Failed to publish template. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!templateId) return;
    
    setIsSubmitting(true);
    try {
      // Update settings
      await updateTemplate(templateId, {
        settings: wizardData.settings
      });
      
      toast.success('Draft saved');
      
      console.log('✅ Draft saved successfully!');
      console.log('   Template ID:', templateId);
      console.log('   Status: draft');
      
      router.push('/hr/interviews');
      
    } catch (error: any) {
      console.error('🔴 Error saving draft:', error);
      const errorMessage = error?.message || 'Failed to save draft. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // Cancel
  // ═══════════════════════════════════════════════════════════

  const handleCancel = () => {
    if (templateId) {
      console.log('ℹ️  Cancelling wizard. Draft saved (ID:', templateId, ')');
      toast.info('Draft saved. You can edit it later.');
    } else {
      console.log('ℹ️  Cancelling wizard. No template created.');
    }
    router.push('/hr/interviews');
  };

  // ═══════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════

  const handleNext = () => {
    if (currentStep === 1) {
      handleStep1Next();
    } else if (currentStep === 2) {
      handleStep2Next();
    }
  };

  const isStepValid = stepValidation[currentStep as keyof typeof stepValidation];
  const canProceed = currentStep === 3 || isStepValid;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <WizardProgress currentStep={currentStep} />

      {/* Step Content */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 mb-6">
        {currentStep === 1 && (
          <Step1BasicInfo
            templateId={templateId}
            data={{ title: wizardData.title, description: wizardData.description }}
            onDataChange={(data) => setWizardData({ ...wizardData, ...data })}
            onValidationChange={(isValid) =>
              setStepValidation({ ...stepValidation, 1: isValid })
            }
          />
        )}

        {currentStep === 2 && (
          <Step2Questions
            templateId={templateId}
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
          {/* Cancel button */}
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>

        <div className="flex items-center gap-3">
          {currentStep === 3 ? (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={isSubmitting || !templateId}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={handlePublish}
                disabled={isSubmitting || !templateId}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg cursor-pointer"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Template'}
              </button>
            </>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-lg"
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
