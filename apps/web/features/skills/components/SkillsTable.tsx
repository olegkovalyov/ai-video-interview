import { Edit2, Trash2, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skill } from "../types/skill.types";

interface SkillsTableProps {
  skills: Skill[];
  onToggleStatus: (skillId: string) => void;
  onEdit: (skillId: string) => void;
  onDelete: (skillId: string) => void;
  loadingSkills?: Set<string>;
}

export function SkillsTable({
  skills,
  onToggleStatus,
  onEdit,
  onDelete,
  loadingSkills = new Set(),
}: SkillsTableProps) {
  if (skills.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Wrench className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-sm font-medium text-foreground mb-1">
            No skills found
          </h3>
          <p className="text-xs text-muted-foreground">
            Try adjusting your filters or create a new skill
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
                  Skill Name
                </th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  Category
                </th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  Description
                </th>
                <th className="p-3 text-center text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="p-3 text-right text-xs font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill, index) => {
                const isLoading = loadingSkills.has(skill.id);
                return (
                  <tr
                    key={skill.id || `skill-${index}`}
                    className={cn(
                      "border-b last:border-0 hover:bg-muted/30 transition-colors",
                      isLoading && "opacity-50",
                    )}
                  >
                    <td className="p-3">
                      <div className="text-sm font-medium text-foreground">
                        {skill.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {skill.slug}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{skill.categoryName}</Badge>
                    </td>
                    <td className="max-w-xs truncate p-3 text-sm text-muted-foreground">
                      {skill.description || "\u2014"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => onToggleStatus(skill.id)}
                          disabled={isLoading}
                          className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                            isLoading
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer",
                            skill.isActive
                              ? "bg-success"
                              : "bg-muted-foreground/30",
                          )}
                          title={
                            skill.isActive
                              ? "Click to deactivate"
                              : "Click to activate"
                          }
                        >
                          <span
                            className={cn(
                              "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                              skill.isActive
                                ? "translate-x-5"
                                : "translate-x-0.5",
                            )}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(skill.id)}
                          disabled={isLoading}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(skill.id)}
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
