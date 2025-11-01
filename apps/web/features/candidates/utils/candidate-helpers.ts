import { Candidate, CandidateStatus } from '../types/candidate.types';

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getStatusColor(status: CandidateStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-400/20 text-green-200 border-green-400/30';
    case 'in_progress':
      return 'bg-blue-400/20 text-blue-200 border-blue-400/30';
    case 'pending':
      return 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30';
    case 'invited':
      return 'bg-purple-400/20 text-purple-200 border-purple-400/30';
    default:
      return 'bg-gray-400/20 text-gray-200 border-gray-400/30';
  }
}

export function getStatusLabel(status: CandidateStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'pending':
      return 'Pending';
    case 'invited':
      return 'Invited';
    default:
      return status;
  }
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-300';
  if (score >= 75) return 'text-yellow-300';
  if (score >= 60) return 'text-orange-300';
  return 'text-red-300';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function getCandidatesByStatus(candidates: Candidate[], status: CandidateStatus): Candidate[] {
  return candidates.filter((c) => c.status === status);
}

export function getCandidatesByInterview(candidates: Candidate[], interviewTitle: string): Candidate[] {
  return candidates.filter((c) => c.interview === interviewTitle);
}

export function getAverageScore(candidates: Candidate[]): number {
  const completedWithScore = candidates.filter((c) => c.status === 'completed' && c.score !== null);
  if (completedWithScore.length === 0) return 0;
  const total = completedWithScore.reduce((sum, c) => sum + (c.score || 0), 0);
  return Math.round(total / completedWithScore.length);
}
