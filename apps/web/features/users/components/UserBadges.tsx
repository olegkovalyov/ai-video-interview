import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRole, UserStatus } from "../types/user.types";

interface UserRoleBadgeProps {
  role: UserRole;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const config = {
    admin: { label: "Admin", variant: "default" as const },
    hr: { label: "HR", variant: "info" as const },
    candidate: { label: "Candidate", variant: "secondary" as const },
  };

  const { label, variant } = config[role];

  return (
    <Badge variant={variant}>
      {role === "admin" && <Crown className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  );
}

interface UserStatusBadgeProps {
  status: UserStatus;
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const config = {
    active: { label: "Active", variant: "success" as const },
    suspended: { label: "Suspended", variant: "error" as const },
    deleted: { label: "Deleted", variant: "secondary" as const },
  };

  const { label, variant } = config[status];

  return <Badge variant={variant}>{label}</Badge>;
}
