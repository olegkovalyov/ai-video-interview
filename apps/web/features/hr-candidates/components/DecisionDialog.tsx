"use client";

import { useState } from "react";
import { Loader2, ThumbsUp, ThumbsDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useApproveCandidate,
  useRejectCandidate,
} from "@/lib/query/hooks/use-invitations";

interface DecisionDialogProps {
  open: boolean;
  onClose: () => void;
  invitationId: string;
  candidateName: string;
  type: "approve" | "reject";
}

export function DecisionDialog({
  open,
  onClose,
  invitationId,
  candidateName,
  type,
}: DecisionDialogProps) {
  const [note, setNote] = useState("");
  const approveMutation = useApproveCandidate();
  const rejectMutation = useRejectCandidate();

  if (!open) return null;

  const isApprove = type === "approve";
  const mutation = isApprove ? approveMutation : rejectMutation;
  const isPending = mutation.isPending;
  const noteRequired = !isApprove;
  const canSubmit = !isPending && (!noteRequired || note.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const trimmed = note.trim();

    if (isApprove) {
      approveMutation.mutate(
        { id: invitationId, note: trimmed || undefined },
        { onSuccess: () => handleClose() },
      );
    } else {
      rejectMutation.mutate(
        { id: invitationId, note: trimmed },
        { onSuccess: () => handleClose() },
      );
    }
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-background rounded-lg border shadow-lg w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                isApprove
                  ? "bg-success/10 text-success"
                  : "bg-error/10 text-error"
              }`}
            >
              {isApprove ? (
                <ThumbsUp className="w-4 h-4" />
              ) : (
                <ThumbsDown className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {isApprove ? "Approve Candidate" : "Reject Candidate"}
              </h2>
              <p className="text-xs text-muted-foreground">{candidateName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-accent rounded-md cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-foreground">
            {isApprove
              ? "The candidate will receive an email and in-app notification with your optional message."
              : "The candidate will receive an email with your feedback message. Please provide a reason."}
          </p>

          <div>
            <Label className="mb-2">
              {isApprove ? "Message (optional)" : "Feedback"}
              {noteRequired && <span className="text-error ml-1">*</span>}
            </Label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isApprove
                  ? "Great work! We would like to invite you to the next round..."
                  : "Thank you for your time. We decided to move forward with other candidates..."
              }
              rows={5}
              maxLength={2000}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {note.length}/2000 characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t bg-muted/30">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={
              isApprove
                ? "bg-success hover:bg-success/90"
                : "bg-error hover:bg-error/90"
            }
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isApprove ? "Approving..." : "Rejecting..."}
              </>
            ) : (
              <>
                {isApprove ? (
                  <ThumbsUp className="w-4 h-4 mr-2" />
                ) : (
                  <ThumbsDown className="w-4 h-4 mr-2" />
                )}
                Confirm {isApprove ? "Approval" : "Rejection"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
