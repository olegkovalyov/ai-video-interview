import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield, Briefcase } from "lucide-react";
import { UserStats } from "../types/user.types";

interface UserStatsCardsProps {
  stats: UserStats;
}

const STAT_CONFIG = [
  {
    key: "total" as const,
    label: "Total Users",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "active" as const,
    label: "Active",
    icon: UserCheck,
    color: "text-success",
    bg: "bg-success-light",
  },
  {
    key: "suspended" as const,
    label: "Suspended",
    icon: UserX,
    color: "text-error",
    bg: "bg-error-light",
  },
  {
    key: "admins" as const,
    label: "Admins",
    icon: Shield,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "hrs" as const,
    label: "HR Managers",
    icon: Briefcase,
    color: "text-info",
    bg: "bg-info-light",
  },
];

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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
                {stats[s.key]}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
