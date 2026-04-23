"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { SubscriptionCard } from "@/features/billing/components/SubscriptionCard";
import { UsageCard } from "@/features/billing/components/UsageCard";
import { InvoicesCard } from "@/features/billing/components/InvoicesCard";
import { BillingActions } from "@/features/billing/components/BillingActions";
import { useSubscription } from "@/lib/query/hooks/use-billing";

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Stripe checkout redirect feedback
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      toast.success("Subscription activated", {
        description: "Welcome aboard! Your new plan is now active.",
      });
      router.replace("/profile/billing");
    } else if (canceled === "true") {
      toast.info("Checkout canceled", {
        description: "You can upgrade anytime from the pricing page.",
      });
      router.replace("/profile/billing");
    }
  }, [searchParams, router]);

  // Only load invoices once we know there's a Stripe customer —
  // otherwise Stripe API throws 404 and React Query surfaces an error.
  const { data: subscription } = useSubscription();
  const hasStripeCustomer = !!subscription?.stripeCustomerId;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Billing & subscription
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your plan, usage, and payment methods
        </p>
      </div>

      <SubscriptionCard />

      <UsageCard />

      <BillingActions />

      {hasStripeCustomer && <InvoicesCard />}
    </div>
  );
}
