import type { NotificationTemplateType } from "../domain/value-objects/notification-template.vo";

/**
 * Mapping of template names to email subject lines.
 */
export const TEMPLATE_SUBJECTS: Record<NotificationTemplateType, string> = {
  welcome: "Welcome to AI Interview Platform",
  invitation: "You have been invited to an interview",
  invitation_reminder: "Interview Reminder - Don't forget!",
  interview_started: "A candidate has started their interview",
  interview_completed: "Interview completed - review responses",
  analysis_ready: "AI Analysis is ready for review",
  analysis_failed: "AI Analysis could not be completed",
  candidate_approved: "Congratulations! You have been approved",
  candidate_rejected: "Update on your interview",
  payment_confirmed: "Payment confirmed - subscription active",
  payment_failed: "Payment failed - action required",
  quota_exceeded: "You have reached your usage limit",
  weekly_digest: "Your weekly interview summary",
};
