import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { QuestionOption } from '../../types/template.types';

interface MultipleChoiceOptionsProps {
  options: QuestionOption[];
  onChange: (options: QuestionOption[]) => void;
}

export function MultipleChoiceOptions({ options, onChange }: MultipleChoiceOptionsProps) {
  const [newOptionText, setNewOptionText] = useState('');

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;

    const newOption: QuestionOption = {
      id: `opt-${Date.now()}`,
      text: newOptionText.trim(),
      isCorrect: false,
    };

    onChange([...options, newOption]);
    setNewOptionText('');
  };

  const handleRemoveOption = (id: string) => {
    onChange(options.filter(opt => opt.id !== id));
  };

  const handleToggleCorrect = (id: string) => {
    onChange(
      options.map(opt =>
        opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt,
      ),
    );
  };

  const correctAnswers = options.filter(opt => opt.isCorrect);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-white font-medium">
          Answer Options <span className="text-red-400">*</span>
        </label>
        {correctAnswers.length > 0 && (
          <span className="text-sm text-green-400">
            ✓ {correctAnswers.length} correct answer{correctAnswers.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Options List */}
      {options.length > 0 && (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div
              key={option.id}
              className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10"
            >
              {/* Correct checkbox */}
              <button
                type="button"
                onClick={() => handleToggleCorrect(option.id)}
                className={`
                  flex items-center justify-center w-6 h-6 rounded border-2 transition-all cursor-pointer
                  ${
                    option.isCorrect
                      ? 'bg-green-500 border-green-500'
                      : 'bg-transparent border-white/30 hover:border-white/50'
                  }
                `}
              >
                {option.isCorrect && <Check className="w-4 h-4 text-white" />}
              </button>

              {/* Option label */}
              <span className="text-white/70 font-semibold text-sm min-w-[20px]">
                {String.fromCharCode(65 + index)})
              </span>

              {/* Option text */}
              <div className="flex-1">
                <span className={`text-white ${option.isCorrect ? 'font-semibold' : ''}`}>
                  {option.text}
                </span>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveOption(option.id)}
                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
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
          onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
          placeholder="Enter answer option..."
          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <button
          type="button"
          onClick={handleAddOption}
          disabled={!newOptionText.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Help text */}
      <div className="text-sm text-white/50">
        💡 Click the checkbox to mark correct answers. Multiple correct answers are allowed.
      </div>

      {/* Validation warning */}
      {options.length > 0 && correctAnswers.length === 0 && (
        <div className="text-sm text-yellow-300">
          ⚠️ Please mark at least one answer as correct
        </div>
      )}
    </div>
  );
}
