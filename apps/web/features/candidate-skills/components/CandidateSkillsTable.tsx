import { Edit2, Trash2, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CandidateSkill,
  ProficiencyLevel,
} from "../types/candidate-skill.types";

interface CandidateSkillsTableProps {
  skills: CandidateSkill[];
  onEdit: (skillId: string) => void;
  onRemove: (skillId: string) => void;
  loadingSkills?: Set<string>;
}

const getProficiencyStars = (level: ProficiencyLevel): number => {
  const map = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
  return map[level];
};

const getProficiencyColor = (level: ProficiencyLevel): string => {
  const map = {
    beginner: "text-warning",
    intermediate: "text-info",
    advanced: "text-primary",
    expert: "text-success",
  };
  return map[level];
};

export function CandidateSkillsTable({
  skills,
  onEdit,
  onRemove,
  loadingSkills = new Set(),
}: CandidateSkillsTableProps) {
  if (skills.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Star className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-sm font-medium text-foreground mb-1">
            No skills added yet
          </h3>
          <p className="text-xs text-muted-foreground">
            Add your first skill to showcase your expertise
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  Skill
                </th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  Proficiency
                </th>
                <th className="p-3 text-center text-xs font-medium text-muted-foreground">
                  Experience
                </th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  Description
                </th>
                <th className="p-3 text-right text-xs font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => {
                const isLoading = loadingSkills.has(skill.skillId);
                const stars = getProficiencyStars(skill.proficiencyLevel);
                const starColor = getProficiencyColor(skill.proficiencyLevel);

                return (
                  <tr
                    key={skill.skillId}
                    className={cn(
                      "border-b last:border-0 hover:bg-muted/30 transition-colors",
                      isLoading && "opacity-50",
                    )}
                  >
                    <td className="p-3">
                      <div className="text-sm font-medium text-foreground">
                        {skill.skillName}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {[...Array(4)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3.5 w-3.5",
                              i < stars
                                ? `${starColor} fill-current`
                                : "text-muted-foreground/20",
                            )}
                          />
                        ))}
                      </div>
                      <div className="mt-0.5 text-xs capitalize text-muted-foreground">
                        {skill.proficiencyLevel}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm text-foreground">
                        {skill.yearsOfExperience} yr
                        {skill.yearsOfExperience !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="max-w-xs truncate p-3 text-sm text-muted-foreground">
                      {skill.description || "\u2014"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(skill.skillId)}
                          disabled={isLoading}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemove(skill.skillId)}
                          disabled={isLoading}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
