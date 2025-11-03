export interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  bio?: string;
  timezone: string;
  language: string;
}

export interface AvatarUploadData {
  file: File;
  previewUrl: string;
}
