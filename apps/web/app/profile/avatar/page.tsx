"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Trash2, Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, uploadAvatar, deleteAvatar } from '@/lib/api/users';

export default function UploadAvatarPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser();
        setCurrentAvatar(user.avatarUrl || null);
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await uploadAvatar(selectedFile);
      setCurrentAvatar(result.avatarUrl);
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Are you sure you want to remove your avatar?')) return;

    setIsUploading(true);
    setError(null);

    try {
      await deleteAvatar();
      setCurrentAvatar(null);
      router.push('/profile');
    } catch (err: any) {
      setError(err.message || 'Failed to remove avatar');
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] }
      } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
        <Header />
        <main className="container mx-auto px-6 py-12 max-w-3xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
              <p className="text-white/80">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header />
      
      <main className="container mx-auto px-6 py-12 max-w-3xl">
        {/* Back Button */}
        <Link 
          href="/profile"
          className="inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center space-x-3">
            <Camera className="w-10 h-10" />
            <span>Change Avatar</span>
          </h1>
          <p className="text-lg text-white/80">
            Upload a new profile picture
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-200 p-4 rounded-lg mb-6 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5" />
            <span>Avatar uploaded successfully! Redirecting...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-6 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Current Avatar */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Current Avatar</h2>
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {currentAvatar ? (
                      <Image src={currentAvatar} alt="Avatar" width={96} height={96} className="rounded-full" />
                    ) : (
                      'JD'
                    )}
                  </div>
                  {currentAvatar && (
                    <Button
                      onClick={handleRemoveAvatar}
                      disabled={isUploading}
                      variant="glass"
                      className="flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Avatar</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Upload New Avatar */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Upload New Avatar</h2>
                
                {/* Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-white/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {preview ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="w-32 h-32 rounded-full overflow-hidden">
                          <Image 
                            src={preview} 
                            alt="Preview" 
                            width={128} 
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <p className="text-white/80 text-sm">{selectedFile?.name}</p>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreview(null);
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        variant="glass"
                        size="sm"
                      >
                        Choose Different Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 mx-auto text-white/60" />
                      <div>
                        <p className="text-white font-medium mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-white/60 text-sm">
                          PNG, JPG, WEBP up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Guidelines */}
                <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/20">
                  <h3 className="text-sm font-semibold text-white mb-2">Image Guidelines:</h3>
                  <ul className="text-xs text-white/70 space-y-1 list-disc list-inside">
                    <li>Use a square image for best results</li>
                    <li>Recommended size: at least 400x400 pixels</li>
                    <li>Supported formats: JPG, PNG, WEBP</li>
                    <li>Maximum file size: 5MB</li>
                    <li>Your face should be clearly visible</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-white/20">
                <Link href="/profile">
                  <Button type="button" variant="glass">
                    Cancel
                  </Button>
                </Link>
                
                <Button 
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  variant="brand"
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Uploading...' : 'Upload Avatar'}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
