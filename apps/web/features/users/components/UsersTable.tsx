import { Edit2, Trash2, Users as UsersIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User } from "../types/user.types";
import { UserRoleBadge, UserStatusBadge } from "./UserBadges";
import { formatDate, getInitials } from "../utils/user-helpers";

interface UsersTableProps {
  users: User[];
  onStatusToggle: (userId: string) => void;
  onDelete: (userId: string) => void;
  onEdit?: (userId: string) => void;
  loadingUsers?: Set<string>;
}

export function UsersTable({
  users,
  onStatusToggle,
  onDelete,
  onEdit,
  loadingUsers = new Set(),
}: UsersTableProps) {
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <UsersIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-sm font-medium text-foreground mb-1">
            No users found
          </h3>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search filters
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  User
                </th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  Email
                </th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  Role
                </th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  Last Login
                </th>
                <th className="p-3 text-right text-xs font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isLoading = loadingUsers.has(user.id);
                return (
                  <tr
                    key={user.id}
                    className={cn(
                      "border-b last:border-0 hover:bg-muted/30 transition-colors",
                      isLoading && "opacity-50",
                    )}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(user)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {user.firstName} {user.lastName}
                          </div>
                          {user.phone && (
                            <div className="text-xs text-muted-foreground">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="p-3">
                      <UserRoleBadge role={user.role} />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <UserStatusBadge status={user.status} />
                        <button
                          onClick={() => onStatusToggle(user.id)}
                          disabled={isLoading || user.status === "deleted"}
                          className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                            isLoading || user.status === "deleted"
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer",
                            user.status === "active"
                              ? "bg-success"
                              : "bg-muted-foreground/30",
                          )}
                          title={
                            user.status === "active"
                              ? "Click to suspend"
                              : "Click to activate"
                          }
                        >
                          <span
                            className={cn(
                              "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                              user.status === "active"
                                ? "translate-x-5"
                                : "translate-x-0.5",
                            )}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(user.id)}
                            disabled={isLoading}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(user.id)}
                          disabled={isLoading || user.status === "deleted"}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
