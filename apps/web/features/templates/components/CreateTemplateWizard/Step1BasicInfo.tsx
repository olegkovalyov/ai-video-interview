import { useState, useEffect, useRef } from 'react';
import { validateTitle, validateDescription } from '../../utils/template-helpers';

interface Step1BasicInfoProps {
  templateId: string | null;
  data: {
    title: string;
    description: string;
  };
  onDataChange: (data: any) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function Step1BasicInfo({
  templateId,
  data,
  onDataChange,
  onValidationChange,
}: Step1BasicInfoProps) {
  const [errors, setErrors] = useState({
    title: '',
    description: '',
  });
  const prevValidRef = useRef<boolean | null>(null);

  // Validate on data change
  useEffect(() => {
    const titleError = validateTitle(data.title);
    const descriptionError = validateDescription(data.description);

    setErrors({
      title: titleError || '',
      description: descriptionError || '',
    });

    // Notify parent about validation status only if it changed
    const isValid = !titleError && !descriptionError;
    if (prevValidRef.current !== isValid) {
      prevValidRef.current = isValid;
      onValidationChange(isValid);
    }
  }, [data.title, data.description, onValidationChange]);

  return (
    <div className="space-y-6">
      {/* Template ID Indicator */}
      {templateId && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-green-400 text-xl">✅</div>
            <div className="flex-1">
              <p className="text-green-300 font-semibold">Template Draft Created</p>
              <p className="text-sm text-white/70 mt-1">
                Template ID: <code className="text-green-400">{templateId}</code>
              </p>
              <p className="text-xs text-white/50 mt-1">
                Your template is saved. Continue adding questions or cancel to edit later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-white font-semibold mb-2">
          Template Title <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={data.title}
          onChange={(e) => onDataChange({ ...data, title: e.target.value })}
          placeholder="e.g., Frontend Developer Interview"
          className={`
            w-full px-4 py-3 bg-white/10 backdrop-blur-md border rounded-lg text-white placeholder:text-white/50 
            focus:outline-none focus:ring-2 transition-all
            ${
              errors.title
                ? 'border-red-500 focus:ring-red-500/50'
                : 'border-white/20 focus:ring-blue-500/50'
            }
          `}
        />
        {errors.title && <p className="mt-2 text-sm text-red-400">{errors.title}</p>}
        <p className="mt-1 text-sm text-white/50">
          {data.title.length}/100 characters
        </p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-white font-semibold mb-2">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          id="description"
          value={data.description}
          onChange={(e) => onDataChange({ ...data, description: e.target.value })}
          placeholder="Describe the purpose and focus areas of this interview template..."
          rows={6}
          className={`
            w-full px-4 py-3 bg-white/10 backdrop-blur-md border rounded-lg text-white placeholder:text-white/50 
            focus:outline-none focus:ring-2 transition-all resize-none
            ${
              errors.description
                ? 'border-red-500 focus:ring-red-500/50'
                : 'border-white/20 focus:ring-blue-500/50'
            }
          `}
        />
        {errors.description && (
          <p className="mt-2 text-sm text-red-400">{errors.description}</p>
        )}
        <p className="mt-1 text-sm text-white/50">
          {data.description.length}/500 characters
        </p>
      </div>

      {/* Help text */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-200">
          <strong>💡 Tip:</strong> A clear title and detailed description help candidates
          understand what to expect and allow you to organize your templates effectively.
        </p>
      </div>
    </div>
  );
}
