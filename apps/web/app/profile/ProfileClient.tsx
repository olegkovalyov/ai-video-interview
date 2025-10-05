'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Settings, Upload, Shield, Loader2, CheckCircle2, X } from 'lucide-react';
import { getCurrentUser, getCurrentUserStats, type User as UserType, type UserStats } from '@/lib/api/users';

export function ProfileClient() {
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successType, setSuccessType] = useState<string | null>(null);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    // Проверяем URL параметры для success сообщений
    const success = searchParams.get('success');
    if (success) {
      setSuccessType(success);
      setShowSuccessMessage(true);
      
      // Автоматически скрыть через 5 секунд
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Загружаем только профиль пользователя
        const userData = await getCurrentUser();
        setUser(userData);
        
        // TODO: Добавить загрузку статистики когда endpoint будет готов
        // const statsData = await getCurrentUserStats();
        // setStats(statsData);
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

  if (error || !user) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          Error Loading Profile
        </h3>
        <p className="text-white/80">
          {error || 'Failed to load profile data'}
        </p>
      </div>
    );
  }

  const getInitials = () => {
    if (!user) return '?';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email[0]?.toUpperCase() || '?';
  };

  const getFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email.split('@')[0] || 'Unknown';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSuccessMessage = () => {
    switch (successType) {
      case 'password_changed':
        return 'Password successfully updated!';
      case 'profile_updated':
        return 'Profile successfully updated!';
      default:
        return 'Action completed successfully!';
    }
  };

  return (
    <>
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-300 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-white">
                Success!
              </h3>
              <p className="text-white/90">
                {getSuccessMessage()}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={getFullName()}
              className="w-20 h-20 rounded-full object-cover border-2 border-white/30"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {getInitials()}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {getFullName()}
            </h2>
            <p className="text-white/80">{user.email}</p>
            <span
              className={`inline-block mt-1 px-3 py-1 text-sm rounded-full border ${
                user.status === 'active'
                  ? 'bg-green-400/20 text-green-200 border-green-400/30'
                  : 'bg-red-400/20 text-red-200 border-red-400/30'
              }`}
            >
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="border-t border-white/20 pt-4">
          <h3 className="text-lg font-semibold text-white mb-3">
            Quick Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white/60">Joined</p>
              <p className="text-white font-medium">
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/60">Last Updated</p>
              <p className="text-white font-medium">
                {formatDate(user.updatedAt)}
              </p>
            </div>
            {user.phone && (
              <div>
                <p className="text-sm text-white/60">Phone</p>
                <p className="text-white font-medium">{user.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-white/60">Timezone</p>
              <p className="text-white font-medium">{user.timezone}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Language</p>
              <p className="text-white font-medium">{user.language.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {stats && (
          <div className="border-t border-white/20 pt-4 mt-4">
            <h3 className="text-lg font-semibold text-white mb-3">
              Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-white/60">Interviews Created</p>
                <p className="text-white font-medium text-2xl">
                  {stats.interviewsCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Storage Used</p>
                <p className="text-white font-medium text-2xl">
                  {stats.storageUsedMB.toFixed(1)} MB
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Quota Remaining</p>
                <p className="text-white font-medium text-2xl">
                  {stats.quotaRemaining.interviews} interviews
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Edit Profile */}
        <Link href="/profile/edit" className="h-full">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all cursor-pointer h-full flex flex-col">
            <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center mb-4 border border-blue-400/30">
              <Settings className="w-6 h-6 text-blue-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Edit Profile
            </h3>
            <p className="text-sm text-white/70">
              Update your personal information and bio
            </p>
          </div>
        </Link>

        {/* Upload Avatar */}
        <Link href="/profile/avatar" className="h-full">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all cursor-pointer h-full flex flex-col">
            <div className="w-12 h-12 bg-purple-400/20 rounded-lg flex items-center justify-center mb-4 border border-purple-400/30">
              <Upload className="w-6 h-6 text-purple-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Change Avatar
            </h3>
            <p className="text-sm text-white/70">
              Upload a new profile picture
            </p>
          </div>
        </Link>

        {/* View Users (Admin) */}
        <Link href="/admin/users" className="h-full">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all cursor-pointer h-full flex flex-col">
            <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center mb-4 border border-green-400/30">
              <User className="w-6 h-6 text-green-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Manage Users
            </h3>
            <p className="text-sm text-white/70">
              View and manage all users (Admin only)
            </p>
          </div>
        </Link>

        {/* Security */}
        <Link href="/profile/security" className="h-full">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all cursor-pointer h-full flex flex-col">
            <div className="w-12 h-12 bg-red-400/20 rounded-lg flex items-center justify-center mb-4 border border-red-400/30">
              <Shield className="w-6 h-6 text-red-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Security
            </h3>
            <p className="text-sm text-white/70">
              Manage password and security settings
            </p>
          </div>
        </Link>
      </div>

      {/* Bio Section */}
      {user.bio && (
        <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            About Me
          </h3>
          <p className="text-white/80">{user.bio}</p>
        </div>
      )}
    </>
  );
}
