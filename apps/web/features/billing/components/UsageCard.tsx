"use client";

import { ClipboardList, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsage } from "@/lib/query/hooks/use-billing";
import type { UsageItem } from "@/lib/api/billing";

interface Row {
  key: keyof Pick<
    NonNullable<ReturnType<typeof useUsage>["data"]>,
    "interviews" | "templates" | "teamMembers"
  >;
  label: string;
  icon: typeof ClipboardList;
}

const ROWS: Row[] = [
  { key: "interviews", label: "Interviews this month", icon: ClipboardList },
  { key: "templates", label: "Active templates", icon: FileText },
  { key: "teamMembers", label: "Team members", icon: Users },
];

function UsageRow({
  label,
  icon: Icon,
  item,
}: {
  label: string;
  icon: typeof ClipboardList;
  item: UsageItem;
}) {
  const isUnlimited = item.limit === -1;
  const percent = isUnlimited
    ? 0
    : Math.min(100, Math.round((item.used / Math.max(1, item.limit)) * 100));

  const barColor =
    percent >= 90 ? "bg-error" : percent >= 70 ? "bg-warning" : "bg-primary";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm font-medium text-foreground truncate">
            {label}
          </p>
        </div>
        <p className="text-sm tabular-nums text-muted-foreground flex-shrink-0">
          {isUnlimited ? (
            <span className="text-success font-medium">Unlimited</span>
          ) : (
            <>
              <span className="font-semibold text-foreground">{item.used}</span>{" "}
              / {item.limit}
            </>
          )}
        </p>
      </div>
      {!isUnlimited && (
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function UsageCard() {
  const { data, isPending, error } = useUsage();

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-foreground">
          Usage this period
        </h2>
        {data && (
          <p className="text-xs text-muted-foreground">Period: {data.period}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {isPending ? (
          <>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </>
        ) : error || !data ? (
          <p className="text-sm text-muted-foreground">
            Usage data is not available yet. It will appear after your first
            interview.
          </p>
        ) : (
          ROWS.map(({ key, label, icon }) => (
            <UsageRow key={key} label={label} icon={icon} item={data[key]} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
