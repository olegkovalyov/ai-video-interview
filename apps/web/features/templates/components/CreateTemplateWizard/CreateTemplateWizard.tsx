"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { WizardProgress } from "./WizardProgress";
import { Step1BasicInfo } from "./Step1BasicInfo";
import { Step2Questions } from "./Step2Questions";
import { Step3SettingsReview } from "./Step3SettingsReview";
import {
  createTemplate,
  updateTemplate,
  publishTemplate,
} from "../../services/templates-api";
import { logger } from "@/lib/logger";

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
    title: "",
    description: "",
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
        settings: wizardData.settings,
      });

      setTemplateId(response.id);
      setCurrentStep(2);

      toast.success("Template created as draft");
    } catch (error: any) {
      logger.error("Error creating template", error);
      const errorMessage =
        error?.message || "Failed to create template. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // STEP 2: Just navigate (questions handled in Step2Questions)
  // ═══════════════════════════════════════════════════════════

  const handleStep2Next = () => {
    logger.debug(
      "Step 2 -> Step 3: No API call, questions already added via Step2Questions",
    );
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
        settings: wizardData.settings,
      });

      // 2. Publish
      await publishTemplate(templateId);

      toast.success("Template published!");

      logger.debug("Template published successfully", {
        templateId,
        totalQuestions: wizardData.questions.length,
      });

      router.push("/hr/templates");
    } catch (error: any) {
      logger.error("Error publishing template", error);
      const errorMessage =
        error?.message || "Failed to publish template. Please try again.";
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
        settings: wizardData.settings,
      });

      toast.success("Draft saved");

      logger.debug("Draft saved successfully", { templateId, status: "draft" });

      router.push("/hr/templates");
    } catch (error: any) {
      logger.error("Error saving draft", error);
      const errorMessage =
        error?.message || "Failed to save draft. Please try again.";
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
      logger.debug("Cancelling wizard, draft saved", { templateId });
      toast.info("Draft saved. You can edit it later.");
    } else {
      logger.debug("Cancelling wizard, no template created");
    }
    router.push("/hr/templates");
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

  const isStepValid =
    stepValidation[currentStep as keyof typeof stepValidation];
  const canProceed = currentStep === 3 || isStepValid;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <WizardProgress currentStep={currentStep} />

      {/* Step Content */}
      <div className=" rounded-lg p-8 mb-6">
        {currentStep === 1 && (
          <Step1BasicInfo
            templateId={templateId}
            data={{
              title: wizardData.title,
              description: wizardData.description,
            }}
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

      {/* Validation hint */}
      {!canProceed && (
        <p className="text-sm text-warning text-center">
          Please complete all required fields to continue
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {/* Cancel button */}
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-sm font-semibold text-foreground rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
                className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-sm font-semibold text-foreground rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? "Saving..." : "Save as Draft"}
              </button>
              <button
                onClick={handlePublish}
                disabled={isSubmitting || !templateId}
                className="px-6 py-3 bg-success hover:bg-success/90 text-sm font-medium text-white rounded-md transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {isSubmitting ? "Publishing..." : "Publish Template"}
              </button>
            </>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-sm font-medium text-primary-foreground rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-sm"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
