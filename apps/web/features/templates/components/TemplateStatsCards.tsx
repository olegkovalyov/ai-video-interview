import { FileText, CheckCircle, FileEdit, Archive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateStats } from "../types/template.types";

interface TemplateStatsCardsProps {
  stats: TemplateStats;
  loading?: boolean;
}

const STAT_CONFIG = [
  {
    key: "total" as const,
    label: "Total Templates",
    icon: FileText,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "active" as const,
    label: "Active",
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success-light",
  },
  {
    key: "draft" as const,
    label: "Draft",
    icon: FileEdit,
    color: "text-warning",
    bg: "bg-warning-light",
  },
  {
    key: "archived" as const,
    label: "Archived",
    icon: Archive,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
];

export function TemplateStatsCards({
  stats,
  loading = false,
}: TemplateStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {STAT_CONFIG.map((s) => (
        <Card key={s.key}>
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}
            >
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {loading ? "..." : stats[s.key]}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
