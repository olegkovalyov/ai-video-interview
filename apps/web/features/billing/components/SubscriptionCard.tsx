"use client";

import { CheckCircle, AlertCircle, Clock, XCircle, Zap } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/lib/query/hooks/use-billing";
import type { Subscription, SubscriptionStatus } from "@/lib/api/billing";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const map: Record<
    SubscriptionStatus,
    {
      variant: "success" | "warning" | "error" | "info";
      label: string;
      icon: typeof CheckCircle;
    }
  > = {
    active: { variant: "success", label: "Active", icon: CheckCircle },
    trialing: { variant: "info", label: "Trial", icon: Clock },
    past_due: { variant: "warning", label: "Past due", icon: AlertCircle },
    canceled: { variant: "error", label: "Canceled", icon: XCircle },
  };
  const { variant, label, icon: Icon } = map[status];
  return (
    <Badge variant={variant}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}

function LoadingState() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardContent>
    </Card>
  );
}

function NoSubscriptionState() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-foreground">
          No active subscription
        </h2>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          You&apos;re currently on the Free plan. Upgrade to unlock more
          features.
        </p>
        <Button asChild size="sm">
          <Link href="/pricing">
            <Zap className="mr-2 h-4 w-4" />
            View plans
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function CancelBanner({ subscription }: { subscription: Subscription }) {
  if (!subscription.cancelAtPeriodEnd) return null;
  return (
    <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning-foreground">
      <AlertCircle className="inline-block h-4 w-4 mr-1 align-[-2px]" />
      Subscription ends on {formatDate(subscription.currentPeriodEnd)}. You can
      resume anytime before that date.
    </div>
  );
}

function PastDueBanner({ subscription }: { subscription: Subscription }) {
  if (subscription.status !== "past_due") return null;
  return (
    <div className="rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
      <AlertCircle className="inline-block h-4 w-4 mr-1 align-[-2px]" />
      Your last payment failed. Please update your payment method to keep your
      subscription active.
    </div>
  );
}

export function SubscriptionCard() {
  const { data, isPending, error } = useSubscription();

  if (isPending) return <LoadingState />;
  if (error || !data) return <NoSubscriptionState />;

  const { planName, planType, status, currentPeriodStart, currentPeriodEnd } =
    data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Current plan
            </p>
            <h2 className="text-2xl font-bold text-foreground mt-0.5">
              {planName}
            </h2>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Current period: {formatDate(currentPeriodStart)} –{" "}
          {formatDate(currentPeriodEnd)}
        </div>

        <PastDueBanner subscription={data} />
        <CancelBanner subscription={data} />

        {planType === "free" && (
          <div className="pt-2">
            <Button asChild size="sm">
              <Link href="/pricing">
                <Zap className="mr-2 h-4 w-4" />
                Upgrade plan
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
