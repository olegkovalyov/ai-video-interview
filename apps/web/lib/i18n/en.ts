/**
 * English locale strings.
 * Organized by domain for future i18n extraction.
 * Import specific sections: `import { common, interviews } from '@/lib/i18n/en'`
 */

export const common = {
  loading: 'Loading...',
  saving: 'Saving...',
  searching: 'Searching...',
  sending: 'Sending...',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  create: 'Create',
  back: 'Back',
  next: 'Next',
  previous: 'Previous',
  tryAgain: 'Try Again',
  refresh: 'Refresh',
  search: 'Search',
  filter: 'Filter',
  sortBy: 'Sort by:',
  showing: 'Showing',
  found: 'Found',
  noResults: 'No results found',
  confirm: {
    delete: 'Are you sure you want to delete this? This action cannot be undone.',
  },
  status: {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    completed: 'Completed',
    expired: 'Expired',
  },
  time: {
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: (n: number) => `${n} days ago`,
  },
} as const;

export const auth = {
  login: 'Sign In',
  logout: 'Sign Out',
  register: 'Sign Up',
  selectRole: {
    title: 'Choose Your Role',
    hr: 'HR Manager',
    hrDesc: 'Create interviews and evaluate candidates',
    candidate: 'Candidate',
    candidateDesc: 'Take interviews and showcase your skills',
  },
  errors: {
    unauthorized: 'Please sign in to continue',
    forbidden: 'You do not have permission to access this page',
  },
} as const;

export const interviews = {
  title: 'Interviews',
  start: 'Start Interview',
  resume: 'Resume Interview',
  starting: 'Starting...',
  viewResults: 'View Results',
  status: {
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    expired: 'Expired',
  },
  dashboard: {
    title: 'My Dashboard',
    subtitle: 'Track your interview invitations and progress',
    pendingInterviews: 'Pending Interviews',
    inProgress: 'In Progress',
    completed: 'Completed',
    yourInterviews: 'Your Interviews',
    noInvitations: 'No interview invitations yet',
    expiredNotice: 'This invitation has expired',
  },
  review: {
    title: 'Interview Review',
    backToList: 'Back to Review List',
    aiSummary: 'AI Summary',
    candidateResponse: 'Candidate Response:',
    playVideo: 'Play Video',
    videoDuration: (s: string) => `Video duration: ${s}`,
    noResponse: 'No response submitted for this question',
    aiPlaceholder: 'AI Analysis will appear here after processing',
    noQuestions: 'No questions found for this interview',
  },
  toast: {
    started: 'Interview started!',
    completed: 'Interview completed',
    startFailed: 'Failed to start interview',
    loadFailed: 'Failed to load invitations',
    invitationCreated: 'Invitation sent',
  },
} as const;

export const templates = {
  title: 'Templates',
  create: 'Create Template',
  edit: 'Edit Template',
  duplicate: 'Duplicate Template',
  publish: 'Publish Template',
  archive: 'Archive Template',
  noTemplates: 'No templates yet',
  noTemplatesDesc: 'Create your first interview template to get started',
  noTemplatesFiltered: 'No templates found',
  noTemplatesFilteredDesc: 'Try adjusting your filters or search query',
  toast: {
    created: 'Template created',
    updated: 'Template updated',
    published: 'Template published',
    deleted: 'Template deleted',
    duplicated: 'Template duplicated',
    archived: 'Template archived',
  },
  settings: {
    totalTimeLimit: 'Total Time Limit',
    allowRetakes: 'Allow Retakes',
    showTimer: 'Show Timer',
    randomizeQuestions: 'Randomize Questions',
  },
} as const;

export const companies = {
  title: 'Companies',
  create: 'Create Company',
  edit: 'Edit Company',
  searchPlaceholder: 'Search companies...',
  toast: {
    created: 'Company created',
    updated: 'Company updated',
    deleted: 'Company deleted',
  },
  confirm: {
    delete: (name: string) => `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  },
  fields: {
    name: 'Company Name',
    industry: 'Industry',
    size: 'Company Size',
    website: 'Website',
    location: 'Location',
    description: 'Description',
  },
} as const;

export const users = {
  title: 'Users',
  manageUsers: 'Manage Users',
  toast: {
    suspended: 'User suspended',
    activated: 'User activated',
    deleted: 'User deleted',
    roleAssigned: 'Role assigned',
    roleRemoved: 'Role removed',
  },
  confirm: {
    delete: 'Are you sure you want to delete this user? This action cannot be undone.',
  },
} as const;

export const skills = {
  title: 'Skills',
  addSkill: 'Add New Skill',
  proficiency: {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert',
  },
  toast: {
    added: 'Skill added',
    updated: 'Skill updated',
    removed: 'Skill removed',
    created: 'Skill created',
    deleted: 'Skill deleted',
    experienceUpdated: 'Experience level updated',
  },
} as const;

export const candidates = {
  title: 'Candidates',
  search: 'Search Candidates',
  invite: 'Invite',
  inviteToInterview: 'Invite to Interview',
  sendInvitation: 'Send Invitation',
  filterBySkills: 'Filter by Skills',
  minProficiency: 'Minimum Proficiency',
  minYears: 'Minimum Years',
  experienceLevel: 'Experience Level',
  noResults: 'No candidates found',
  noResultsDesc: 'Try adjusting your search criteria',
  toast: {
    invited: (name: string) => `Interview invitation sent to ${name}`,
    inviteFailed: 'Failed to create invitation',
  },
  tabs: {
    search: 'Search',
    invited: 'Invited',
    completed: 'Completed',
  },
} as const;

export const hrDashboard = {
  title: 'HR Dashboard',
  subtitle: 'Overview of your recruitment activities',
  activeInterviews: 'Active Interviews',
  pendingReviews: 'Pending Reviews',
  totalInvitations: 'Total Invitations',
  waitingForReview: (n: number) => `${n} candidate${n > 1 ? 's' : ''} waiting for review`,
  reviewNeeded: 'Completed interviews need your evaluation',
  reviewNow: 'Review Now',
  quickActions: 'Quick Actions',
  inviteCandidate: 'Invite Candidate',
  inviteCandidateDesc: 'Search and send invitations',
  createTemplate: 'Create Template',
  createTemplateDesc: 'Design new interview',
  manageCompanies: 'Manage Companies',
  manageCompaniesDesc: 'Add or edit companies',
} as const;

export const profile = {
  title: 'My Profile',
  editProfile: 'Edit Profile',
  toast: {
    updated: 'Profile updated',
    avatarUpdated: 'Avatar updated',
    avatarRemoved: 'Avatar removed',
  },
} as const;
