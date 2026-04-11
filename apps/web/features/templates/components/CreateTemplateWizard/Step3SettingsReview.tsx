import { Check } from "lucide-react";
import { InterviewSettings } from "../../types/template.types";

interface WizardData {
  title: string;
  description: string;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    timeLimit: number;
    required: boolean;
  }>;
}

interface Step3SettingsReviewProps {
  data: {
    settings: InterviewSettings;
    wizardData: WizardData;
  };
  onDataChange: (data: { settings: InterviewSettings }) => void;
}

export function Step3SettingsReview({
  data,
  onDataChange,
}: Step3SettingsReviewProps) {
  const { settings, wizardData } = data;

  const totalQuestionsTime = wizardData.questions.reduce(
    (sum, q) => sum + q.timeLimit,
    0,
  );
  const suggestedTotalTime = Math.ceil(totalQuestionsTime / 60) + 10; // Add 10 min buffer

  return (
    <div className="space-y-6">
      {/* Settings Section */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground text-lg mb-4">
          Interview Settings
        </h3>

        {/* Total Time Limit */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Total Time Limit (minutes)
          </label>
          <input
            type="number"
            value={settings.totalTimeLimit}
            onChange={(e) =>
              onDataChange({
                settings: {
                  ...settings,
                  totalTimeLimit: parseInt(e.target.value),
                },
              })
            }
            min={10}
            max={180}
            step={5}
            className="w-full h-9 px-3 py-1 border border-input rounded-md bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            Suggested: {suggestedTotalTime} minutes (based on questions +
            buffer)
          </p>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="showTimer"
              checked={settings.showTimer}
              onChange={(e) =>
                onDataChange({
                  settings: { ...settings, showTimer: e.target.checked },
                })
              }
              className="mt-1 w-4 h-4 rounded bg-muted border"
            />
            <div>
              <label
                htmlFor="showTimer"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Show timer to candidates
              </label>
              <p className="text-sm text-muted-foreground">
                Candidates will see a countdown timer during the interview
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="allowRetakes"
              checked={settings.allowRetakes}
              onChange={(e) =>
                onDataChange({
                  settings: { ...settings, allowRetakes: e.target.checked },
                })
              }
              className="mt-1 w-4 h-4 rounded bg-muted border"
            />
            <div>
              <label
                htmlFor="allowRetakes"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Allow retakes
              </label>
              <p className="text-sm text-muted-foreground">
                Candidates can retake the interview if they're not satisfied
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="randomizeQuestions"
              checked={settings.randomizeQuestions}
              onChange={(e) =>
                onDataChange({
                  settings: {
                    ...settings,
                    randomizeQuestions: e.target.checked,
                  },
                })
              }
              className="mt-1 w-4 h-4 rounded bg-muted border"
            />
            <div>
              <label
                htmlFor="randomizeQuestions"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Randomize question order
              </label>
              <p className="text-sm text-muted-foreground">
                Questions will appear in random order for each candidate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground text-lg mb-4">
          Review Your Template
        </h3>

        <div className="space-y-4">
          {/* Title & Description */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-5 h-5 text-success" />
              <span className="text-muted-foreground text-sm">Title</span>
            </div>
            <p className="text-sm font-semibold text-foreground ml-7">
              {wizardData.title}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-5 h-5 text-success" />
              <span className="text-muted-foreground text-sm">Description</span>
            </div>
            <p className="text-muted-foreground ml-7">
              {wizardData.description}
            </p>
          </div>

          {/* Questions Count */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-5 h-5 text-success" />
              <span className="text-muted-foreground text-sm">Questions</span>
            </div>
            <p className="text-sm font-semibold text-foreground ml-7">
              {wizardData.questions.length} question
              {wizardData.questions.length !== 1 ? "s" : ""} added
            </p>
            <ul className="ml-7 mt-2 space-y-1 text-sm text-muted-foreground">
              {wizardData.questions.slice(0, 3).map((q, i) => (
                <li key={q.id}>
                  {i + 1}. {q.text.slice(0, 60)}
                  {q.text.length > 60 ? "..." : ""}
                </li>
              ))}
              {wizardData.questions.length > 3 && (
                <li className="text-muted-foreground italic">
                  ... and {wizardData.questions.length - 3} more
                </li>
              )}
            </ul>
          </div>

          {/* Settings Summary */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-5 h-5 text-success" />
              <span className="text-muted-foreground text-sm">Settings</span>
            </div>
            <ul className="ml-7 space-y-1 text-sm text-muted-foreground">
              <li>⏱️ Total time: {settings.totalTimeLimit} minutes</li>
              <li>
                👁️ Timer visibility: {settings.showTimer ? "Visible" : "Hidden"}
              </li>
              <li>
                🔁 Retakes: {settings.allowRetakes ? "Allowed" : "Not allowed"}
              </li>
              <li>
                🔀 Question order:{" "}
                {settings.randomizeQuestions ? "Randomized" : "Fixed"}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-success/30 bg-success-light p-4">
        <p className="text-sm text-foreground">
          <strong>Ready to create:</strong> Your template looks good! You can
          save it as a draft or publish it immediately.
        </p>
      </div>
    </div>
  );
}
