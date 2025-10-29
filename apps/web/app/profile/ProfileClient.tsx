'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Edit2, Save, X, Upload, User as UserIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUser, updateCurrentUser, type User } from '@/lib/api/users';
import { TIMEZONES, LANGUAGES } from '@/lib/constants/timezones';
import { toast } from 'sonner';

// Validation schema
const profileSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s'-]+$/, 'Only letters, spaces, hyphens and apostrophes allowed'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s'-]+$/, 'Only letters, spaces, hyphens and apostrophes allowed'),
  phone: z.string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  timezone: z.string(),
  language: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const bioValue = watch('bio') || '';

  // Handle success messages from URL params
  useEffect(() => {
    const success = searchParams.get('success');
    
    if (success === 'password_changed') {
      toast.success('Password changed successfully!');
      // Clean URL
      router.replace('/profile');
    } else if (success === 'profile_updated') {
      toast.success('Profile updated successfully!');
      // Clean URL
      router.replace('/profile');
    }
  }, [searchParams, router]);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      
      // Normalize timezone
      let normalizedTimezone = userData.timezone || 'UTC+00:00';
      if (normalizedTimezone === 'UTC') {
        normalizedTimezone = 'UTC+00:00';
      } else if (normalizedTimezone.match(/^UTC[+-]\d{1,2}$/)) {
        const match = normalizedTimezone.match(/^(UTC[+-])(\d{1,2})$/);
        if (match && match[1] && match[2]) {
          normalizedTimezone = `${match[1]}${match[2].padStart(2, '0')}:00`;
        }
      }
      
      reset({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        timezone: normalizedTimezone,
        language: userData.language || 'en',
      });
    } catch (err) {
      console.error('Failed to load user:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateCurrentUser({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        bio: data.bio || undefined,
        timezone: data.timezone,
        language: data.language,
      });
      
      toast.success('Profile updated successfully!');
      setIsEditMode(false);
      await loadUser();
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('Failed to save changes');
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        bio: user.bio || '',
        timezone: user.timezone || 'UTC+00:00',
        language: user.language || 'en',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;

    // TODO: Implement actual upload to MinIO through API
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Uploading avatar...',
        success: 'Avatar updated successfully!',
        error: 'Failed to upload avatar',
      }
    );

    // After successful upload, update user and hide form
    setTimeout(() => {
      setShowAvatarUpload(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      loadUser();
    }, 1000);
  };

  const handleCancelUpload = () => {
    setShowAvatarUpload(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {previewUrl || user?.avatarUrl ? (
                <img
                  src={previewUrl || user?.avatarUrl}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/30"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white/30">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
            </div>

            <div className="flex-1">
              {!showAvatarUpload ? (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Profile Photo</h3>
                  <p className="text-white/70 text-sm mb-4">
                    Upload a professional photo. Max size: 5MB
                  </p>
                  <Button
                    variant="glass"
                    onClick={() => setShowAvatarUpload(true)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Change Photo
                  </Button>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Upload New Photo</h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-white/70 mb-4
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-white/20 file:text-white
                      hover:file:bg-white/30
                      file:cursor-pointer cursor-pointer"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="brand"
                      onClick={handleAvatarUpload}
                      disabled={!selectedFile}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </Button>
                    <Button
                      variant="glass"
                      onClick={handleCancelUpload}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Personal Information</h2>
              {!isEditMode ? (
                <Button
                  type="button"
                  variant="glass"
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="brand"
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    type="button"
                    variant="glass"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      First Name *
                    </label>
                    {isEditMode ? (
                      <>
                        <input
                          type="text"
                          {...register('firstName')}
                          className={`w-full px-4 py-2 bg-white/10 border ${
                            errors.firstName ? 'border-red-500' : 'border-white/30'
                          } rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50`}
                        />
                        {errors.firstName && (
                          <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-white text-lg">{user?.firstName || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Last Name *
                    </label>
                    {isEditMode ? (
                      <>
                        <input
                          type="text"
                          {...register('lastName')}
                          className={`w-full px-4 py-2 bg-white/10 border ${
                            errors.lastName ? 'border-red-500' : 'border-white/30'
                          } rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50`}
                        />
                        {errors.lastName && (
                          <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-white text-lg">{user?.lastName || '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Email Address *
                    </label>
                    <p className="text-white text-lg">{user?.email || '—'}</p>
                    <p className="text-xs text-white/60 mt-1">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Phone Number
                    </label>
                    {isEditMode ? (
                      <>
                        <input
                          type="tel"
                          {...register('phone')}
                          placeholder="+1 (555) 000-0000"
                          className={`w-full px-4 py-2 bg-white/10 border ${
                            errors.phone ? 'border-red-500' : 'border-white/30'
                          } rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50`}
                        />
                        {errors.phone && (
                          <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-white text-lg">{user?.phone || '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">About</h3>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Bio
                  </label>
                  {isEditMode ? (
                    <>
                      <textarea
                        {...register('bio')}
                        rows={4}
                        maxLength={500}
                        placeholder="Tell us about yourself..."
                        className={`w-full px-4 py-2 bg-white/10 border ${
                          errors.bio ? 'border-red-500' : 'border-white/30'
                        } rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50 resize-none`}
                      />
                      {errors.bio && (
                        <p className="text-red-400 text-xs mt-1">{errors.bio.message}</p>
                      )}
                      <p className="text-xs text-white/60 mt-1">
                        {bioValue.length}/500 characters
                      </p>
                    </>
                  ) : (
                    <p className="text-white whitespace-pre-wrap">{user?.bio || '—'}</p>
                  )}
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Timezone
                    </label>
                    {isEditMode ? (
                      <select
                        {...register('timezone')}
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 text-white"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-white">
                        {TIMEZONES.find(tz => tz.value === user?.timezone)?.label || user?.timezone || '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Language
                    </label>
                    {isEditMode ? (
                      <select
                        {...register('language')}
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 text-white"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-white">
                        {LANGUAGES.find(lang => lang.value === user?.language)?.label || user?.language || '—'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
