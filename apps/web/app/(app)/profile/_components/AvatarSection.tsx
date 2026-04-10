"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UPLOAD } from "@/lib/constants/app";

interface AvatarSectionProps {
  avatarUrl?: string;
  initials: string;
  onUploadComplete: () => void;
}

export function AvatarSection({
  avatarUrl,
  initials,
  onUploadComplete,
}: AvatarSectionProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > UPLOAD.MAX_FILE_SIZE) {
        toast.error("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [],
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    // TODO: Implement actual upload to MinIO through API
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: "Uploading avatar...",
      success: "Avatar updated successfully!",
      error: "Failed to upload avatar",
    });

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
    <Card>
      <CardContent className="flex items-center gap-6 p-6">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Avatar"
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover border"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
            {initials}
          </div>
        )}

        <div className="flex-1">
          {!showUpload ? (
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Profile Photo
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Upload a professional photo. Max size: 5MB
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpload(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-muted-foreground mb-3 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
              />
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleUpload}
                  disabled={!selectedFile}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
