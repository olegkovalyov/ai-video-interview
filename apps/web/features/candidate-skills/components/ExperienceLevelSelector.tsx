"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Briefcase, Check } from "lucide-react";
import {
  updateMyExperienceLevel,
  getExperienceLevelDisplay,
  type ExperienceLevel,
} from "@/lib/api/candidate-skills";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExperienceLevelSelectorProps {
  currentLevel: ExperienceLevel | null;
  onUpdate: (level: ExperienceLevel) => void;
}

const EXPERIENCE_LEVELS: { value: ExperienceLevel; description: string }[] = [
  { value: "junior", description: "0-2 years" },
  { value: "mid", description: "2-5 years" },
  { value: "senior", description: "5-10 years" },
  { value: "lead", description: "10+ years" },
];

export function ExperienceLevelSelector({
  currentLevel,
  onUpdate,
}: ExperienceLevelSelectorProps) {
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<ExperienceLevel | null>(
    currentLevel,
  );

  const handleSelect = async (level: ExperienceLevel) => {
    if (level === selected) return;

    setSaving(true);
    try {
      await updateMyExperienceLevel(level);
      setSelected(level);
      onUpdate(level);
      toast.success("Experience level updated");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update experience level";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">
            Your Experience Level
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EXPERIENCE_LEVELS.map(({ value, description }) => {
            const display = getExperienceLevelDisplay(value);
            const isSelected = selected === value;

            return (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                disabled={saving}
                className={cn(
                  "relative rounded-lg border p-3 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary/30 hover:bg-accent",
                  saving && "opacity-50 cursor-not-allowed",
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-primary" : "text-foreground",
                  )}
                >
                  {display.label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
