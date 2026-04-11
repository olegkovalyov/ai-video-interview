"use client";

import { ClipboardList } from "lucide-react";

export function InterviewsGrid() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ClipboardList className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">
        Interview management has moved to Templates and Invitations sections.
      </p>
    </div>
  );
}
