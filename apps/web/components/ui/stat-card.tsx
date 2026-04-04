import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "transition-all hover:border-primary/30 hover:shadow-md",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
            {change && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  change.trend === "up" && "text-success",
                  change.trend === "down" && "text-error",
                  change.trend === "neutral" && "text-muted-foreground",
                )}
              >
                {change.value}
              </p>
            )}
          </div>
          {icon && (
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
