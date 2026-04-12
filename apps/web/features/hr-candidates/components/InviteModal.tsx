"use client";

import { useState, useEffect } from "react";
import { X, Send, FileText, Building2, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { CandidateSearchResult } from "@/lib/api/candidate-search";
import { useActiveTemplates } from "@/lib/query/hooks/use-templates";
import { useCompanies } from "@/lib/query/hooks/use-companies";
import { useCreateInvitation } from "@/lib/query/hooks/use-invitations";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  candidate: CandidateSearchResult | null;
  onSuccess?: () => void;
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function InviteModal({
  open,
  onClose,
  candidate,
  onSuccess,
}: InviteModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [allowPause, setAllowPause] = useState(true);
  const [showTimer, setShowTimer] = useState(true);

  const { data: templates = [], isPending: templatesLoading } =
    useActiveTemplates();
  const { data: companiesData, isPending: companiesLoading } = useCompanies({
    limit: 100,
  });
  const createInvitation = useCreateInvitation();

  const companies = companiesData?.data ?? [];
  const isLoading = templatesLoading || companiesLoading;

  useEffect(() => {
    if (open) {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 7);
      setExpiresAt(defaultExpiry.toISOString().slice(0, 16));
      setSelectedTemplate("");
      setSelectedCompany("");
      setAllowPause(true);
      setShowTimer(true);

      if (companies.length === 1 && companies[0]) {
        setSelectedCompany(companies[0].id);
      }
    }
  }, [open, companies.length]);

  if (!open || !candidate) return null;

  const handleSubmit = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    if (!selectedCompany) {
      toast.error("Please select a company");
      return;
    }
    if (!expiresAt) {
      toast.error("Please set a deadline");
      return;
    }

    const company = companies.find((c) => c.id === selectedCompany);
    const template = templates.find((t) => t.id === selectedTemplate);

    createInvitation.mutate(
      {
        templateId: selectedTemplate,
        candidateId: candidate.userId,
        companyName: company?.name || "",
        expiresAt: new Date(expiresAt).toISOString(),
        allowPause,
        showTimer,
      },
      {
        onSuccess: () => {
          toast.success(`Interview invitation sent to ${candidate.fullName}`, {
            description: `Template: ${template?.title} • Company: ${company?.name}`,
          });
          onSuccess?.();
          onClose();
        },
      },
    );
  };

  const initials = candidate.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background rounded-lg border shadow-lg w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2
              id="invite-modal-title"
              className="text-lg font-semibold text-foreground"
            >
              Invite to Interview
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Send interview invitation to {candidate.fullName}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Candidate Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {candidate.fullName}
              </p>
              <p className="text-xs text-muted-foreground">{candidate.email}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <>
              {/* Template Selection */}
              <div>
                <Label className="mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Interview Template <span className="text-error">*</span>
                </Label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className={selectClass}
                  disabled={templates.length === 0}
                >
                  <option value="">
                    {templates.length === 0
                      ? "No active templates available"
                      : "Select a template..."}
                  </option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title} ({template.questionsCount} questions)
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Selection */}
              <div>
                <Label className="mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company <span className="text-error">*</span>
                </Label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className={selectClass}
                  disabled={companies.length === 0}
                >
                  <option value="">
                    {companies.length === 0
                      ? "No companies available"
                      : "Select a company..."}
                  </option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <Label className="mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Deadline <span className="text-error">*</span>
                </Label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Candidate must complete the interview before this date
                </p>
              </div>

              {/* Options */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPause}
                    onChange={(e) => setAllowPause(e.target.checked)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <span className="text-sm text-foreground">Allow Pause</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTimer}
                    onChange={(e) => setShowTimer(e.target.checked)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <span className="text-sm text-foreground">Show Timer</span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createInvitation.isPending ||
              isLoading ||
              !selectedTemplate ||
              !selectedCompany ||
              !expiresAt
            }
          >
            {createInvitation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
