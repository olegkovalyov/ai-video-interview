// Components (client-side exports only)
export { UsersList } from './components/UsersList';

// Types (safe for both server and client)
export type { User, UserRole, UserStatus, UserFilters, UserStats } from './types/user.types';

// Utils (safe for both server and client)
export { formatDate, getInitials, getFullName } from './utils/user-helpers';

// Note: Hooks, components details, and services are internal to the feature
// Import UsersList directly for pages
