import Link from 'next/link';
import { ArrowLeft, Shield, Key, Smartphone, AlertTriangle } from 'lucide-react';

export default function SecurityPage() {
  return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/profile"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Security Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account security and authentication
          </p>
        </div>

        {/* Password Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Password
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Change your password regularly
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Last changed: 30 days ago
            </p>
            <Link
              href="http://localhost:8080/realms/ai-video-interview/account"
              target="_blank"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Change Password in Keycloak
            </Link>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add an extra layer of security
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Status: Not Enabled
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Protect your account with 2FA
                </p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold rounded-full">
                Recommended
              </span>
            </div>
            <Link
              href="http://localhost:8080/realms/ai-video-interview/account"
              target="_blank"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Enable 2FA in Keycloak
            </Link>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Active Sessions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your active login sessions
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Current Session
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  MacBook Pro • Chrome • Moscow
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Last active: Just now
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold rounded-full">
                Current
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Mobile Device
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  iPhone • Safari • Moscow
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Last active: 2 hours ago
                </p>
              </div>
              <button className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium">
                Revoke
              </button>
            </div>
          </div>
        </div>

        {/* Security Recommendations */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                Security Recommendations
              </h4>
              <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1 list-disc list-inside">
                <li>Enable two-factor authentication for better security</li>
                <li>Use a strong, unique password</li>
                <li>Review active sessions regularly</li>
                <li>Never share your password with anyone</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  );
}
