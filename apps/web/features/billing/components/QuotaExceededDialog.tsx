"use client";

import Link from "next/link";
import { Zap, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface QuotaExceededDialogProps {
  open: boolean;
  onClose: () => void;
  resource?: string;
  currentPlan?: string;
  limit?: number;
}

function resourceLabel(resource?: string): string {
  switch (resource) {
    case "interviews":
      return "interview invitations";
    case "templates":
      return "templates";
    case "teamMembers":
      return "team members";
    default:
      return "this resource";
  }
}

export function QuotaExceededDialog({
  open,
  onClose,
  resource = "interviews",
  currentPlan = "free",
  limit,
}: QuotaExceededDialogProps) {
  const label = resourceLabel(resource);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 mb-2">
            <AlertCircle className="h-6 w-6 text-warning" />
          </div>
          <DialogTitle>Plan limit reached</DialogTitle>
          <DialogDescription>
            Your <span className="font-medium capitalize">{currentPlan}</span>{" "}
            plan allows{" "}
            {typeof limit === "number" && limit >= 0
              ? `${limit} ${label} per month`
              : label}
            . Upgrade to unlock more and keep inviting candidates.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-primary/5 p-4 text-sm">
          <p className="font-medium text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            What Plus gives you
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>• 100 interview invitations per month</li>
            <li>• Up to 50 active templates</li>
            <li>• 5 team members</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Not now
          </Button>
          <Button asChild>
            <Link href="/pricing" onClick={onClose}>
              <Zap className="mr-2 h-4 w-4" />
              View plans
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
