"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, Loader2, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/lib/query/hooks/use-notifications";

interface ToggleGroup {
  title: string;
  description: string;
  templates: Array<{ key: string; label: string; description: string }>;
}

const GROUPS: ToggleGroup[] = [
  {
    title: "Invitations & Interviews",
    description: "Updates about interview invitations and progress",
    templates: [
      {
        key: "invitation",
        label: "New invitation",
        description: "When you receive a new interview invitation",
      },
      {
        key: "invitation_reminder",
        label: "Invitation reminder",
        description: "24 hours before an interview deadline",
      },
      {
        key: "interview_started",
        label: "Candidate started interview",
        description: "When a candidate begins their interview (HR only)",
      },
      {
        key: "interview_completed",
        label: "Candidate completed interview",
        description: "When a candidate finishes their interview (HR only)",
      },
    ],
  },
  {
    title: "AI Analysis",
    description: "Updates about AI-powered interview analysis",
    templates: [
      {
        key: "analysis_ready",
        label: "Analysis ready",
        description: "When AI analysis is complete",
      },
      {
        key: "analysis_failed",
        label: "Analysis failed",
        description: "When AI analysis encounters an error",
      },
    ],
  },
  {
    title: "HR Decisions",
    description: "Approval or rejection of your candidacy",
    templates: [
      {
        key: "candidate_approved",
        label: "Approval",
        description: "When HR approves your candidacy (candidate only)",
      },
      {
        key: "candidate_rejected",
        label: "Rejection",
        description: "When HR rejects your candidacy (candidate only)",
      },
    ],
  },
  {
    title: "Billing & Plans",
    description: "Subscription and payment notifications",
    templates: [
      {
        key: "payment_confirmed",
        label: "Payment confirmed",
        description: "Successful subscription payments",
      },
      {
        key: "payment_failed",
        label: "Payment failed",
        description: "Failed payment attempts",
      },
      {
        key: "quota_exceeded",
        label: "Quota exceeded",
        description: "When your plan limit is reached",
      },
    ],
  },
  {
    title: "Digests",
    description: "Periodic summaries",
    templates: [
      {
        key: "weekly_digest",
        label: "Weekly digest",
        description: "Summary of the past week's activity (Mondays)",
      },
    ],
  },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const { data, isPending } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (!data) return;
    setEmailEnabled(data.emailEnabled);
    setInAppEnabled(data.inAppEnabled);
    setSubscriptions(data.subscriptions || {});
  }, [data]);

  const handleSubscriptionToggle = (key: string, value: boolean) => {
    setSubscriptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(
      { emailEnabled, inAppEnabled, subscriptions },
      {
        onSuccess: () => toast.success("Preferences saved"),
        onError: (err: Error) => toast.error(err.message || "Failed to save"),
      },
    );
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Notification Preferences
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose how and when you receive notifications
        </p>
      </div>

      {/* Master channel toggles */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Channels</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Email notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  Receive notifications at your registered email address
                </p>
              </div>
            </div>
            <Toggle
              checked={emailEnabled}
              onChange={setEmailEnabled}
              label="Email notifications"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Bell className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  In-app notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  Show notifications in the bell icon dropdown
                </p>
              </div>
            </div>
            <Toggle
              checked={inAppEnabled}
              onChange={setInAppEnabled}
              label="In-app notifications"
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-event subscriptions */}
      {GROUPS.map((group) => (
        <Card key={group.title}>
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {group.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {group.description}
              </p>
            </div>
            <div className="space-y-3">
              {group.templates.map((tpl) => (
                <div
                  key={tpl.key}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {tpl.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tpl.description}
                    </p>
                  </div>
                  <Toggle
                    checked={subscriptions[tpl.key] !== false}
                    onChange={(v) => handleSubscriptionToggle(tpl.key, v)}
                    label={tpl.label}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
