import { Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface WizardProgressProps {
  currentStep: number;
  steps: Step[];
}

export function WizardProgress({ currentStep, steps }: WizardProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isUpcoming = currentStep < step.number;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                        : 'bg-white/10 text-white/50'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={`
                      text-sm font-semibold
                      ${isCurrent ? 'text-white' : 'text-white/70'}
                    `}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-white/50 mt-1">{step.description}</div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-4 relative" style={{ top: '-36px' }}>
                  <div className="h-full bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={`
                        h-full transition-all duration-500
                        ${isCompleted ? 'bg-green-500 w-full' : 'bg-transparent w-0'}
                      `}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
