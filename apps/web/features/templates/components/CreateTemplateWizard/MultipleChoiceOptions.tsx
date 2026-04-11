import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { QuestionOption } from "../../types/template.types";

interface MultipleChoiceOptionsProps {
  options: QuestionOption[];
  onChange: (options: QuestionOption[]) => void;
}

export function MultipleChoiceOptions({
  options,
  onChange,
}: MultipleChoiceOptionsProps) {
  const [newOptionText, setNewOptionText] = useState("");

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;

    const newOption: QuestionOption = {
      id: `opt-${Date.now()}`,
      text: newOptionText.trim(),
      isCorrect: false,
    };

    onChange([...options, newOption]);
    setNewOptionText("");
  };

  const handleRemoveOption = (id: string) => {
    onChange(options.filter((opt) => opt.id !== id));
  };

  const handleToggleCorrect = (id: string) => {
    onChange(
      options.map((opt) =>
        opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt,
      ),
    );
  };

  const correctAnswers = options.filter((opt) => opt.isCorrect);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground">
          Answer Options <span className="text-destructive">*</span>
        </label>
        {correctAnswers.length > 0 && (
          <span className="text-sm text-success">
            ✓ {correctAnswers.length} correct answer
            {correctAnswers.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Options List */}
      {options.length > 0 && (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div
              key={option.id}
              className="flex items-center gap-2 p-3 rounded-lg border bg-card"
            >
              {/* Correct checkbox */}
              <button
                type="button"
                onClick={() => handleToggleCorrect(option.id)}
                className={`
                  flex items-center justify-center w-6 h-6 rounded border-2 transition-all cursor-pointer
                  ${
                    option.isCorrect
                      ? "bg-green-500 border-green-500"
                      : "bg-transparent border-input hover:border-white/50"
                  }
                `}
              >
                {option.isCorrect && <Check className="w-4 h-4 text-white" />}
              </button>

              {/* Option label */}
              <span className="text-muted-foreground font-semibold text-sm min-w-[20px]">
                {String.fromCharCode(65 + index)})
              </span>

              {/* Option text */}
              <div className="flex-1">
                <span
                  className={`text-foreground ${option.isCorrect ? "font-semibold" : ""}`}
                >
                  {option.text}
                </span>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveOption(option.id)}
                className="p-1 text-destructive hover:text-red-300 hover:bg-destructive/5 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Option Form */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newOptionText}
          onChange={(e) => setNewOptionText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddOption()}
          placeholder="Enter answer option..."
          className="flex-1 h-9 px-3 py-1 border border-input rounded-md bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={handleAddOption}
          disabled={!newOptionText.trim()}
          className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-sm font-medium text-primary-foreground rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Help text */}
      <div className="text-sm text-muted-foreground">
        💡 Click the checkbox to mark correct answers. Multiple correct answers
        are allowed.
      </div>

      {/* Validation warning */}
      {options.length > 0 && correctAnswers.length === 0 && (
        <div className="text-sm text-warning">
          ⚠️ Please mark at least one answer as correct
        </div>
      )}
    </div>
  );
}
