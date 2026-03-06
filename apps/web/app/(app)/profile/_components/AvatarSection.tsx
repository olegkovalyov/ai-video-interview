'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UPLOAD } from '@/lib/constants/app';

interface AvatarSectionProps {
  avatarUrl?: string;
  initials: string;
  onUploadComplete: () => void;
}

export function AvatarSection({ avatarUrl, initials, onUploadComplete }: AvatarSectionProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > UPLOAD.MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    // TODO: Implement actual upload to MinIO through API
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Uploading avatar...',
        success: 'Avatar updated successfully!',
        error: 'Failed to upload avatar',
      },
    );

    setTimeout(() => {
      setShowUpload(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      onUploadComplete();
    }, 1000);
  }, [selectedFile, onUploadComplete]);

  const handleCancel = useCallback(() => {
    setShowUpload(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const displayUrl = previewUrl || avatarUrl;

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {displayUrl ? (
              <Image
                src={displayUrl}
                alt="Avatar"
                width={128}
                height={128}
                className="w-32 h-32 rounded-full object-cover border-4 border-white/30"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white/30">
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1">
            {!showUpload ? (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Profile Photo</h3>
                <p className="text-white/70 text-sm mb-4">
                  Upload a professional photo. Max size: 5MB
                </p>
                <Button
                  variant="glass"
                  onClick={() => setShowUpload(true)}
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
                    onClick={handleUpload}
                    disabled={!selectedFile}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                  <Button variant="glass" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
