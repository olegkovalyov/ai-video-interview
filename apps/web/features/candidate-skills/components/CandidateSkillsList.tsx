"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";
import { CandidateSkillsTable } from "./CandidateSkillsTable";
import { EditSkillForm } from "./EditSkillForm";
import { ExperienceLevelSelector } from "./ExperienceLevelSelector";
import {
  getMyCandidateSkills,
  removeMyCandidateSkill,
  type CandidateSkillsByCategory,
  type CandidateSkill,
  type ExperienceLevel,
} from "@/lib/api/candidate-skills";
import { toast } from "sonner";

export function CandidateSkillsList() {
  const [skillsByCategory, setSkillsByCategory] = useState<
    CandidateSkillsByCategory[]
  >([]);
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState<Set<string>>(new Set());
  const [editingSkill, setEditingSkill] = useState<CandidateSkill | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getMyCandidateSkills();
      setSkillsByCategory(response.skills);
      setExperienceLevel(response.experienceLevel);
    } catch (error) {
      logger.error("Failed to fetch data:", error);
      toast.error("Failed to load your profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = fetchData;

  useEffect(() => {
    fetchData();
  }, []);

  const withSkillLock = async <T,>(
    skillId: string,
    action: () => Promise<T>,
  ): Promise<T | void> => {
    setLoadingSkills((prev) => new Set(prev).add(skillId));
    try {
      const result = await action();
      await fetchSkills();
      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Operation failed";
      logger.error("Operation failed:", error);
      toast.error(message);
    } finally {
      setLoadingSkills((prev) => {
        const next = new Set(prev);
        next.delete(skillId);
        return next;
      });
    }
  };

  const handleEdit = (skillId: string) => {
    const skill = skillsByCategory
      .flatMap((cat) => cat.skills)
      .find((s) => s.skillId === skillId);
    if (skill) setEditingSkill(skill);
  };

  const handleRemove = async (skillId: string) => {
    const skill = skillsByCategory
      .flatMap((cat) => cat.skills)
      .find((s) => s.skillId === skillId);
    if (!skill) return;
    if (!confirm(`Remove "${skill.skillName}" from your profile?`)) return;

    await withSkillLock(skillId, async () => {
      await removeMyCandidateSkill(skillId);
      toast.success("Skill removed");
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalSkills = skillsByCategory.reduce(
    (sum, cat) => sum + cat.skills.length,
    0,
  );

  return (
    <>
      <ExperienceLevelSelector
        currentLevel={experienceLevel}
        onUpdate={(level) => setExperienceLevel(level)}
      />

      {editingSkill && (
        <EditSkillForm
          skill={editingSkill}
          onClose={() => setEditingSkill(null)}
          onSuccess={() => {
            setEditingSkill(null);
            fetchSkills();
          }}
        />
      )}

      <p className="mb-4 text-sm text-muted-foreground">
        You have{" "}
        <span className="font-medium text-foreground">{totalSkills}</span> skill
        {totalSkills !== 1 ? "s" : ""} across{" "}
        <span className="font-medium text-foreground">
          {skillsByCategory.length}
        </span>{" "}
        categor{skillsByCategory.length !== 1 ? "ies" : "y"}
      </p>

      {skillsByCategory.length === 0 ? (
        <CandidateSkillsTable
          skills={[]}
          onEdit={handleEdit}
          onRemove={handleRemove}
          loadingSkills={loadingSkills}
        />
      ) : (
        <div className="space-y-6">
          {skillsByCategory.map((category) => (
            <div key={category.categoryId}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                <span className="h-5 w-1 rounded bg-primary" />
                {category.categoryName}
                <span className="text-sm font-normal text-muted-foreground">
                  ({category.skills.length})
                </span>
              </h2>
              <CandidateSkillsTable
                skills={category.skills}
                onEdit={handleEdit}
                onRemove={handleRemove}
                loadingSkills={loadingSkills}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
