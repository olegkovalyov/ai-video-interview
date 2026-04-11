import { Wrench, CheckCircle, XCircle, FolderTree } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SkillStats } from "../types/skill.types";

interface SkillStatsCardsProps {
  stats: SkillStats;
}

const STAT_CONFIG = [
  { key: "total" as const, label: "Total Skills", icon: Wrench, color: "text-primary", bg: "bg-primary/10" },
  { key: "active" as const, label: "Active", icon: CheckCircle, color: "text-success", bg: "bg-success-light" },
  { key: "inactive" as const, label: "Inactive", icon: XCircle, color: "text-error", bg: "bg-error-light" },
  { key: "totalCategories" as const, label: "Categories", icon: FolderTree, color: "text-primary", bg: "bg-primary/10" },
];

export function SkillStatsCards({ stats }: SkillStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {STAT_CONFIG.map((s) => (
        <Card key={s.key}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats[s.key]}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
