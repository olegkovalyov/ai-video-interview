'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUser, updateCurrentUser, type User } from '@/lib/api/users';
import { TIMEZONES, LANGUAGES } from '@/lib/constants/timezones';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { AvatarSection } from './_components/AvatarSection';

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

function normalizeTimezone(tz: string | undefined): string {
  if (!tz || tz === 'UTC') return 'UTC+00:00';
  const match = tz.match(/^(UTC[+-])(\d{1,2})$/);
  if (match?.[1] && match[2]) {
    return `${match[1]}${match[2].padStart(2, '0')}:00`;
  }
  return tz;
}

export function ProfileClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const bioValue = watch('bio') || '';

  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'password_changed') {
      toast.success('Password changed successfully!');
      router.replace('/profile');
    } else if (success === 'profile_updated') {
      toast.success('Profile updated successfully!');
      router.replace('/profile');
    }
  }, [searchParams, router]);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      reset({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        timezone: normalizeTimezone(userData.timezone),
        language: userData.language || 'en',
      });
    } catch (err) {
      logger.error('Failed to load user:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

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
      logger.error('Failed to update profile:', err);
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
        timezone: normalizeTimezone(user.timezone),
        language: user.language || 'en',
      });
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

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;
  const INPUT_CLASS = 'w-full px-4 py-2 bg-white/10 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50';

  return (
    <div className="space-y-6">
      <AvatarSection
        avatarUrl={user?.avatarUrl}
        initials={initials}
        onUploadComplete={loadUser}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Personal Information</h2>
              {!isEditMode ? (
                <Button
                  type="button"
                  variant="outline"
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
                    variant="default"
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
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
                    <label className="block text-sm font-medium text-white/80 mb-2">First Name *</label>
                    {isEditMode ? (
                      <>
                        <input
                          type="text"
                          {...register('firstName')}
                          className={`${INPUT_CLASS} ${errors.firstName ? 'border-red-500' : 'border-white/30'}`}
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
                    <label className="block text-sm font-medium text-white/80 mb-2">Last Name *</label>
                    {isEditMode ? (
                      <>
                        <input
                          type="text"
                          {...register('lastName')}
                          className={`${INPUT_CLASS} ${errors.lastName ? 'border-red-500' : 'border-white/30'}`}
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
                    <label className="block text-sm font-medium text-white/80 mb-2">Email Address *</label>
                    <p className="text-white text-lg">{user?.email || '—'}</p>
                    <p className="text-xs text-white/60 mt-1">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Phone Number</label>
                    {isEditMode ? (
                      <>
                        <input
                          type="tel"
                          {...register('phone')}
                          placeholder="+1 (555) 000-0000"
                          className={`${INPUT_CLASS} ${errors.phone ? 'border-red-500' : 'border-white/30'}`}
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
                  <label className="block text-sm font-medium text-white/80 mb-2">Bio</label>
                  {isEditMode ? (
                    <>
                      <textarea
                        {...register('bio')}
                        rows={4}
                        maxLength={500}
                        placeholder="Tell us about yourself..."
                        className={`${INPUT_CLASS} resize-none ${errors.bio ? 'border-red-500' : 'border-white/30'}`}
                      />
                      {errors.bio && (
                        <p className="text-red-400 text-xs mt-1">{errors.bio.message}</p>
                      )}
                      <p className="text-xs text-white/60 mt-1">{bioValue.length}/500 characters</p>
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
                    <label className="block text-sm font-medium text-white/80 mb-2">Timezone</label>
                    {isEditMode ? (
                      <select
                        {...register('timezone')}
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 text-white"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-white">
                        {TIMEZONES.find(tz => tz.value === user?.timezone)?.label || user?.timezone || '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Language</label>
                    {isEditMode ? (
                      <select
                        {...register('language')}
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 text-white"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
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
