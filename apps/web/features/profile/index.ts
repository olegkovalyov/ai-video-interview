// Components (client-side exports only)
export { ProfileNav } from './components/ProfileNav';
export { ProfileWrapper } from './components/ProfileWrapper';

// Types
export type { ProfileFormData, AvatarUploadData } from './types/profile.types';

// Utils
export { profileSchema } from './utils/validation';

// Note: ProfileClient component is complex and remains in app/(app)/profile/
// for now. Can be migrated later if needed.
