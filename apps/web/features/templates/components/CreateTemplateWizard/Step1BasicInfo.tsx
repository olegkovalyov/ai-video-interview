import { useState, useEffect, useRef } from "react";
import {
  validateTitle,
  validateDescription,
} from "../../utils/template-helpers";

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
    title: "",
    description: "",
  });
  const prevValidRef = useRef<boolean | null>(null);

  // Validate on data change
  useEffect(() => {
    const titleError = validateTitle(data.title);
    const descriptionError = validateDescription(data.description);

    setErrors({
      title: titleError || "",
      description: descriptionError || "",
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
        <div className="p-4 rounded-lg border border-success/30 bg-success-light">
          <div className="flex items-start gap-3">
            <div className="text-success text-lg">&#10003;</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Template Draft Created
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Template ID: <code className="text-success">{templateId}</code>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your template is saved. Continue adding questions or cancel to
                edit later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-semibold text-foreground mb-2"
        >
          Template Title <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={data.title}
          onChange={(e) => onDataChange({ ...data, title: e.target.value })}
          placeholder="e.g., Frontend Developer Interview"
          className={`
            w-full px-4 py-3 bg-card border rounded-lg text-foreground placeholder:text-muted-foreground 
            focus:outline-none focus:ring-2 transition-all
            ${
              errors.title
                ? "border-destructive focus:ring-destructive/50"
                : "border-input focus:ring-ring/50"
            }
          `}
        />
        {errors.title && (
          <p className="mt-2 text-sm text-destructive">{errors.title}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {data.title.length}/100 characters
        </p>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-semibold text-foreground mb-2"
        >
          Description <span className="text-destructive">*</span>
        </label>
        <textarea
          id="description"
          value={data.description}
          onChange={(e) =>
            onDataChange({ ...data, description: e.target.value })
          }
          placeholder="Describe the purpose and focus areas of this interview template..."
          rows={6}
          className={`
            w-full px-4 py-3 bg-card border rounded-lg text-foreground placeholder:text-muted-foreground 
            focus:outline-none focus:ring-2 transition-all resize-none
            ${
              errors.description
                ? "border-destructive focus:ring-destructive/50"
                : "border-input focus:ring-ring/50"
            }
          `}
        />
        {errors.description && (
          <p className="mt-2 text-sm text-destructive">{errors.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {data.description.length}/500 characters
        </p>
      </div>

      {/* Help text */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> A clear title and
          detailed description help candidates understand what to expect and
          allow you to organize your templates effectively.
        </p>
      </div>
    </div>
  );
}
