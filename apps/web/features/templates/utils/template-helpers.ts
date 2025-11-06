/**
 * Template Helper Functions
 */

import { TemplateStatus } from '../types/template.types';

/**
 * Get status color classes
 */
export function getStatusColor(status: TemplateStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'draft':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'archived':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    default:
      return 'bg-white/10 text-white/70 border-white/20';
  }
}

/**
 * Get status icon
 */
export function getStatusIcon(status: TemplateStatus): string {
  switch (status) {
    case 'active':
      return '🟢';
    case 'draft':
      return '🟡';
    case 'archived':
      return '📦';
    default:
      return '⚪';
  }
}

/**
 * Format date relative (e.g., "2 days ago")
 */
export function formatDateRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Format date absolute (e.g., "Nov 6, 2024")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format duration (minutes to human readable)
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Validate template title
 */
export function validateTitle(title: string): string | null {
  if (!title || title.trim().length === 0) {
    return 'Title is required';
  }
  if (title.length < 3) {
    return 'Title must be at least 3 characters';
  }
  if (title.length > 100) {
    return 'Title must be less than 100 characters';
  }
  return null;
}

/**
 * Validate template description
 */
export function validateDescription(description: string): string | null {
  if (!description || description.trim().length === 0) {
    return 'Description is required';
  }
  if (description.length < 10) {
    return 'Description must be at least 10 characters';
  }
  if (description.length > 500) {
    return 'Description must be less than 500 characters';
  }
  return null;
}
