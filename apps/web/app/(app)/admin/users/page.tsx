import { UsersList } from "@/features/users";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all users in the system
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/users/create">
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Link>
        </Button>
      </div>

      <UsersList />
    </div>
  );
}
