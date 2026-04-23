"use client";

import { useState } from "react";
import { CreditCard, ExternalLink, Loader2, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCancelSubscription,
  useCreatePortalSession,
  useResumeSubscription,
  useSubscription,
} from "@/lib/query/hooks/use-billing";

export function BillingActions() {
  const { data: subscription } = useSubscription();
  const portalMutation = useCreatePortalSession();
  const cancelMutation = useCancelSubscription();
  const resumeMutation = useResumeSubscription();
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const hasStripeCustomer = !!subscription?.stripeCustomerId;
  const isPaid = subscription?.planType !== "free";
  const isCanceling = subscription?.cancelAtPeriodEnd === true;

  const handlePortal = () => {
    portalMutation.mutate(undefined, {
      onSuccess: (res) => {
        if (res.portalUrl) {
          window.location.href = res.portalUrl;
        } else {
          toast.info(res.message || "Upgrade to manage your billing.");
        }
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleCancel = () => {
    cancelMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Subscription will end at the period end");
        setConfirmCancelOpen(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleResume = () => {
    resumeMutation.mutate(undefined, {
      onSuccess: () => toast.success("Subscription resumed"),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  if (!subscription) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-foreground">
          Manage billing
        </h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasStripeCustomer && (
          <Button
            variant="outline"
            onClick={handlePortal}
            disabled={portalMutation.isPending}
            className="w-full sm:w-auto"
          >
            {portalMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Manage payment methods
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        )}

        {isPaid && !isCanceling && (
          <div>
            <Button
              variant="outline"
              onClick={() => setConfirmCancelOpen(true)}
              className="w-full sm:w-auto text-error hover:text-error"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel subscription
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              You can keep using your plan until the end of the current period.
            </p>
          </div>
        )}

        {isPaid && isCanceling && (
          <Button
            onClick={handleResume}
            disabled={resumeMutation.isPending}
            className="w-full sm:w-auto"
          >
            {resumeMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Resume subscription
          </Button>
        )}
      </CardContent>

      <Dialog
        open={confirmCancelOpen}
        onOpenChange={(v) => !v && setConfirmCancelOpen(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel subscription?</DialogTitle>
            <DialogDescription>
              Your {subscription.planName} plan will stay active until the end
              of the current billing period. No refund will be issued, and you
              can resume anytime before it ends.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmCancelOpen(false)}
              disabled={cancelMutation.isPending}
            >
              Keep plan
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Confirm cancellation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
