import Link from 'next/link';
import { ArrowLeft, Upload, X } from 'lucide-react';

export default function AvatarPage() {
  return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
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
            Change Avatar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a new profile picture
          </p>
        </div>

        {/* Current Avatar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Avatar
          </h3>
          <div className="flex items-center space-x-4">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              JD
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                This is your current avatar
              </p>
              <button className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium flex items-center">
                <X className="w-4 h-4 mr-1" />
                Remove Avatar
              </button>
            </div>
          </div>
        </div>

        {/* Upload New Avatar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upload New Avatar
          </h3>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Click to upload or drag and drop
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              PNG, JPG, GIF up to 5MB
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Recommended size: 400x400px
            </p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors"
            >
              Choose File
            </label>
          </div>

          {/* Preview (Hidden by default) */}
          <div className="mt-6 hidden">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Preview
            </h4>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  filename.jpg
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  2.4 MB
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
              Upload Avatar
            </button>
            <Link
              href="/profile"
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-3 px-6 rounded-lg text-center transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Guidelines */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Avatar Guidelines
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>Use a clear, professional photo of yourself</li>
            <li>Image should be square (1:1 ratio)</li>
            <li>Maximum file size: 5MB</li>
            <li>Supported formats: JPG, PNG, GIF</li>
            <li>Avoid logos or graphics (unless you're a brand)</li>
          </ul>
        </div>
      </div>
  );
}
