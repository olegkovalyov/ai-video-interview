"use client";

import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCreateCheckoutSession } from "@/lib/query/hooks/use-billing";
import type { PlanType } from "@/lib/api/billing";

interface PlanCheckoutButtonProps {
  planType: PlanType;
  variant?: "default" | "outline";
  size?: "default" | "lg" | "sm";
  className?: string;
}

export function PlanCheckoutButton({
  planType,
  variant = "default",
  size = "lg",
  className,
}: PlanCheckoutButtonProps) {
  const router = useRouter();
  const { isAuthenticated, roles, loading } = useAuth();
  const checkoutMutation = useCreateCheckoutSession();

  const canCheckout =
    isAuthenticated && (roles.includes("hr") || roles.includes("admin"));

  const handleClick = () => {
    // Free plan → signup or dashboard (nothing to purchase).
    if (planType === "free") {
      router.push(isAuthenticated ? "/dashboard" : "/register");
      return;
    }

    // Guest → signup with preselected plan for later upgrade flow.
    if (!isAuthenticated) {
      router.push(`/register?plan=${planType}`);
      return;
    }

    // Authenticated but not HR/admin (e.g. candidate) — they can't buy
    // company plans; show a friendly hint rather than a raw 403.
    if (!canCheckout) {
      toast.info("Only HR or admin users can upgrade the company plan.");
      return;
    }

    // HR/admin → start Stripe checkout.
    checkoutMutation.mutate(
      { planType },
      {
        onSuccess: (res) => {
          if (res.checkoutUrl) {
            window.location.href = res.checkoutUrl;
          } else {
            toast.error("Checkout URL missing");
          }
        },
        onError: (err: Error) => toast.error(err.message || "Checkout failed"),
      },
    );
  };

  const isFree = planType === "free";
  const isLoading = loading || checkoutMutation.isPending;

  let label: string;
  if (isFree) {
    label = isAuthenticated ? "Go to dashboard" : "Start free";
  } else if (!isAuthenticated) {
    label = "Start free trial";
  } else if (!canCheckout) {
    label = "HR-only upgrade";
  } else {
    label = `Upgrade to ${planType === "plus" ? "Plus" : "Pro"}`;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : !isFree ? (
        <Zap className="mr-2 h-4 w-4" />
      ) : null}
      {label}
    </Button>
  );
}
