"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function CreateUserPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "candidate",
    sendWelcomeEmail: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const { createUser, assignRole } = await import("@/lib/api/users");
      const response = await createUser({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: "ChangeMe123!",
      });
      await assignRole(response.data.keycloakId, formData.role);
      router.push("/admin/users");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || "Failed to create user");
      setIsCreating(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create New User
        </h1>
        <p className="text-sm text-muted-foreground">
          Add a new user to the system
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Personal Information
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john.doe@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Default password: ChangeMe123!
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={selectClass}
              >
                <option value="candidate">Candidate</option>
                <option value="hr">HR Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendWelcomeEmail"
                name="sendWelcomeEmail"
                checked={formData.sendWelcomeEmail}
                onChange={handleChange}
                className="accent-primary"
              />
              <Label htmlFor="sendWelcomeEmail" className="font-normal">
                Send welcome email with login instructions
              </Label>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h3 className="text-xs font-semibold text-foreground mb-2">
                Role Descriptions:
              </h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Candidate:</strong> Take
                  interviews and view results
                </p>
                <p>
                  <strong className="text-foreground">HR Manager:</strong>{" "}
                  Create interviews, manage hiring process
                </p>
                <p>
                  <strong className="text-foreground">Administrator:</strong>{" "}
                  Full system access
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button asChild type="button" variant="outline" size="sm">
                <Link href="/admin/users">Cancel</Link>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!isFormValid() || isCreating}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isCreating ? "Creating..." : "Create User"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
