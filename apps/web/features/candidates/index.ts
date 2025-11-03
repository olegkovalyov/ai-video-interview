// Components (client-side exports only)
export { CandidatesList } from './components/CandidatesList';

// Types (safe for both server and client)
export type { Candidate, CandidateStatus, CandidateStats, CandidateFilters } from './types/candidate.types';

// Utils (safe for both server and client)
export {
  formatDate,
  getStatusColor,
  getStatusLabel,
  getScoreColor,
  getInitials,
  getCandidatesByStatus,
  getCandidatesByInterview,
  getAverageScore,
} from './utils/candidate-helpers';

// Note: Hooks, component details, and services are internal to the feature
// Import CandidatesList directly for pages
