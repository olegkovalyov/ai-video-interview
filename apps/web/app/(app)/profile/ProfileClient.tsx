"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Edit2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser, updateCurrentUser, type User } from "@/lib/api/users";
import { TIMEZONES, LANGUAGES } from "@/lib/constants/timezones";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { AvatarSection } from "./_components/AvatarSection";

const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(
      /^[a-zA-Zа-яА-ЯёЁ\s'-]+$/,
      "Only letters, spaces, hyphens and apostrophes allowed",
    ),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(
      /^[a-zA-Zа-яА-ЯёЁ\s'-]+$/,
      "Only letters, spaces, hyphens and apostrophes allowed",
    ),
  phone: z
    .string()
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
      "Please enter a valid phone number",
    )
    .optional()
    .or(z.literal("")),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  timezone: z.string(),
  language: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function normalizeTimezone(tz: string | undefined): string {
  if (!tz || tz === "UTC") return "UTC+00:00";
  const match = tz.match(/^(UTC[+-])(\d{1,2})$/);
  if (match?.[1] && match[2]) {
    return `${match[1]}${match[2].padStart(2, "0")}:00`;
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

  const bioValue = watch("bio") || "";

  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "password_changed") {
      toast.success("Password changed successfully!");
      router.replace("/profile");
    } else if (success === "profile_updated") {
      toast.success("Profile updated successfully!");
      router.replace("/profile");
    }
  }, [searchParams, router]);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      reset({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        phone: userData.phone || "",
        bio: userData.bio || "",
        timezone: normalizeTimezone(userData.timezone),
        language: userData.language || "en",
      });
    } catch (err) {
      logger.error("Failed to load user:", err);
      toast.error("Failed to load profile");
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
      toast.success("Profile updated successfully!");
      setIsEditMode(false);
      await loadUser();
    } catch (err) {
      logger.error("Failed to update profile:", err);
      toast.error("Failed to save changes");
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        bio: user.bio || "",
        timezone: normalizeTimezone(user.timezone),
        language: user.language || "en",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`;

  return (
    <div className="space-y-6">
      <AvatarSection
        avatarUrl={user?.avatarUrl}
        initials={initials}
        onUploadComplete={loadUser}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Personal Information
            </h2>
            {!isEditMode ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  {isEditMode ? (
                    <>
                      <Input
                        id="firstName"
                        {...register("firstName")}
                        className={errors.firstName ? "border-destructive" : ""}
                      />
                      {errors.firstName && (
                        <p className="text-xs text-destructive">
                          {errors.firstName.message}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-foreground">
                      {user?.firstName || "\u2014"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  {isEditMode ? (
                    <>
                      <Input
                        id="lastName"
                        {...register("lastName")}
                        className={errors.lastName ? "border-destructive" : ""}
                      />
                      {errors.lastName && (
                        <p className="text-xs text-destructive">
                          {errors.lastName.message}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-foreground">
                      {user?.lastName || "\u2014"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <p className="text-sm text-foreground">
                    {user?.email || "\u2014"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditMode ? (
                    <>
                      <Input
                        id="phone"
                        type="tel"
                        {...register("phone")}
                        placeholder="+1 (555) 000-0000"
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && (
                        <p className="text-xs text-destructive">
                          {errors.phone.message}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-foreground">
                      {user?.phone || "\u2014"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">About</h3>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditMode ? (
                  <>
                    <Textarea
                      id="bio"
                      {...register("bio")}
                      rows={4}
                      maxLength={500}
                      placeholder="Tell us about yourself..."
                      className={errors.bio ? "border-destructive" : ""}
                    />
                    {errors.bio && (
                      <p className="text-xs text-destructive">
                        {errors.bio.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {bioValue.length}/500 characters
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {user?.bio || "\u2014"}
                  </p>
                )}
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">
                Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  {isEditMode ? (
                    <select
                      id="timezone"
                      {...register("timezone")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-foreground">
                      {TIMEZONES.find((tz) => tz.value === user?.timezone)
                        ?.label ||
                        user?.timezone ||
                        "\u2014"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  {isEditMode ? (
                    <select
                      id="language"
                      {...register("language")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-foreground">
                      {LANGUAGES.find((lang) => lang.value === user?.language)
                        ?.label ||
                        user?.language ||
                        "\u2014"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
