import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  UserFilters as UserFiltersType,
  UserRole,
  UserStatus,
} from "../types/user.types";

interface UserFiltersProps {
  filters: UserFiltersType;
  onSearchChange: (search: string) => void;
  onRoleChange: (role: UserRole | "all") => void;
  onStatusChange: (status: UserStatus | "all") => void;
}

const selectClass =
  "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function UserFilters({
  filters,
  onSearchChange,
  onRoleChange,
  onStatusChange,
}: UserFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              aria-label="Search users"
              value={filters.search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={filters.role}
            onChange={(e) => onRoleChange(e.target.value as UserRole | "all")}
            aria-label="Filter by role"
            className={selectClass}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="user">Candidate</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              onStatusChange(e.target.value as UserStatus | "all")
            }
            aria-label="Filter by status"
            className={selectClass}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
