import { Interview, InterviewStatus } from '../types/interview.types';

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getStatusBadgeVariant(
  status: InterviewStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'closed':
    case 'completed':
      return 'outline';
    default:
      return 'outline';
  }
}

export function getStatusLabel(status: InterviewStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'draft':
      return 'Draft';
    case 'closed':
      return 'Closed';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
}

export function getStatusColor(status: InterviewStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-400/20 text-green-200 border-green-400/30';
    case 'draft':
      return 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30';
    case 'closed':
    case 'completed':
      return 'bg-blue-400/20 text-blue-200 border-blue-400/30';
    default:
      return 'bg-gray-400/20 text-gray-200 border-gray-400/30';
  }
}

export function normalizeInterview(interview: Interview): Interview {
  return {
    ...interview,
    candidatesCount: interview.candidatesCount ?? interview.candidates ?? 0,
    responsesCount: interview.responsesCount ?? interview.responses ?? 0,
  };
}

export function copyToClipboard(text: string, successMessage = 'Copied to clipboard!'): void {
  navigator.clipboard.writeText(text);
  // TODO: Replace with proper toast notification
  alert(successMessage);
}
