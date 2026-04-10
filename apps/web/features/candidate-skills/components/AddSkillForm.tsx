"use client";

import { useState } from "react";
import { X, Save, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSkills, useAddCandidateSkill } from "@/lib/query/hooks/use-skills";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProficiencyLevel } from "@/lib/api/candidate-skills";

interface AddSkillFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSkillForm({ onClose, onSuccess }: AddSkillFormProps) {
  const { data: skillsData, isPending: loading } = useSkills({
    isActive: true,
    limit: 100,
  });
  const addSkillMutation = useAddCandidateSkill();

  const skills = skillsData?.data ?? [];

  const [formData, setFormData] = useState({
    skillId: "",
    proficiencyLevel: "intermediate" as ProficiencyLevel,
    yearsOfExperience: 1,
    description: "",
  });

  if (skills.length > 0 && !formData.skillId) {
    setFormData((prev) => ({ ...prev, skillId: skills[0]!.id }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.skillId) return;

    addSkillMutation.mutate(formData, {
      onSuccess: () => onSuccess(),
    });
  };

  const getProficiencyStars = (level: ProficiencyLevel): number => {
    const map = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    return map[level];
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <h2 className="text-lg font-semibold text-foreground">Add New Skill</h2>
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
              Skill <span className="text-destructive">*</span>
            </Label>
            <select
              value={formData.skillId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, skillId: e.target.value }))
              }
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name} ({skill.categoryName})
                </option>
              ))}
            </select>
          </div>

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
            <Button
              type="submit"
              size="sm"
              disabled={addSkillMutation.isPending}
            >
              {addSkillMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Add Skill
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
