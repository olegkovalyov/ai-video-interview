export const dynamic = "force-dynamic";
import { ProfileWrapper } from "@/features/profile";
import { ProfileTabs } from "@/features/profile/components/ProfileTabs";
import { getUserRoles } from "@/lib/auth/get-user-roles";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRoles = await getUserRoles();

  return (
    <ProfileWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Profile Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <ProfileTabs userRoles={userRoles} />

        {children}
      </div>
    </ProfileWrapper>
  );
}
