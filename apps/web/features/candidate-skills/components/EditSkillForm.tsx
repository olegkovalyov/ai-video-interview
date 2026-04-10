"use client";

import { useState } from "react";
import { X, Save, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  updateMyCandidateSkill,
  type ProficiencyLevel,
  type CandidateSkill,
} from "@/lib/api/candidate-skills";
import { toast } from "sonner";

interface EditSkillFormProps {
  skill: CandidateSkill;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSkillForm({
  skill,
  onClose,
  onSuccess,
}: EditSkillFormProps) {
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    proficiencyLevel: skill.proficiencyLevel as ProficiencyLevel,
    yearsOfExperience: skill.yearsOfExperience,
    description: skill.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyCandidateSkill(skill.skillId, formData);
      toast.success("Skill updated successfully");
      onSuccess();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update skill";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const getProficiencyStars = (level: ProficiencyLevel): number => {
    const map = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    return map[level];
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Edit Skill</h2>
          <p className="text-sm text-muted-foreground">{skill.skillName}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>
              Proficiency Level <span className="text-destructive">*</span>
            </Label>
            <select
              value={formData.proficiencyLevel}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  proficiencyLevel: e.target.value as ProficiencyLevel,
                }))
              }
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5",
                      i < getProficiencyStars(formData.proficiencyLevel)
                        ? "text-warning fill-current"
                        : "text-muted-foreground/20",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs capitalize text-muted-foreground">
                {formData.proficiencyLevel}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Years of Experience <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              max="50"
              value={formData.yearsOfExperience}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  yearsOfExperience: parseInt(e.target.value) || 0,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Tell us about your experience with this skill..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
