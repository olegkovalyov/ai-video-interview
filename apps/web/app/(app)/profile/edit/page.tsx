import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Button */}
        <Link
          href="/profile"
          className="inline-flex items-center text-white/90 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Edit Profile
          </h1>
          <p className="text-white/80">
            Update your personal information
          </p>
        </div>

        {/* Edit Form */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <form className="space-y-6">
            {/* First Name */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                defaultValue="John"
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                defaultValue="Doe"
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                defaultValue="john.doe@example.com"
                disabled
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white/50 cursor-not-allowed"
              />
              <p className="text-xs text-white/60 mt-1">
                Email cannot be changed
              </p>
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                defaultValue="johndoe"
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                defaultValue="+1 (555) 123-4567"
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
              />
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                defaultValue="Software engineer passionate about building scalable systems and mentoring junior developers."
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50 resize-none"
              />
              <p className="text-xs text-white/60 mt-1">
                Max 500 characters
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label
                htmlFor="timezone"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Timezone
              </label>
              <select
                id="timezone"
                defaultValue="UTC+3"
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white"
              >
                <option value="UTC">UTC</option>
                <option value="UTC+3">UTC+3 (Moscow)</option>
                <option value="UTC-5">UTC-5 (New York)</option>
                <option value="UTC-8">UTC-8 (Los Angeles)</option>
                <option value="UTC+1">UTC+1 (Berlin)</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Language
              </label>
              <select
                id="language"
                defaultValue="en"
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white"
              >
                <option value="en">English</option>
                <option value="ru">Русский</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4 border-t border-white/20">
              <button
                type="submit"
                className="flex-1 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </button>
              <Link
                href="/profile"
                className="flex-1 bg-white/10 hover:bg-white/15 border border-white/30 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
