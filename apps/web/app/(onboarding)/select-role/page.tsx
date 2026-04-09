"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { Briefcase, UserCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Role = "candidate" | "hr";

interface RoleOption {
  id: Role;
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
}

const roles: RoleOption[] = [
  {
    id: "candidate",
    title: "Candidate",
    description:
      "Looking for job opportunities and ready to showcase my skills",
    icon: UserCheck,
    features: [
      "Create your professional profile",
      "Take video interviews",
      "Track application status",
      "Receive interview feedback",
    ],
  },
  {
    id: "hr",
    title: "HR Manager",
    description: "Recruiting talent and conducting interviews for my company",
    icon: Briefcase,
    features: [
      "Create interview templates",
      "Review candidate responses",
      "Manage hiring pipeline",
      "Collaborate with team",
    ],
  },
];

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectRole = async () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    setIsSubmitting(true);
    logger.debug("[SELECT-ROLE] Starting role selection", {
      role: selectedRole,
    });

    try {
      const selectResponse = await apiPost("/api/users/me/select-role", {
        role: selectedRole,
      });
      logger.debug("[SELECT-ROLE] Role assigned", selectResponse);
      toast.success(
        `Role selected: ${selectedRole === "hr" ? "HR Manager" : "Candidate"}`,
      );

      toast.info("Updating your session...");
      const refreshResponse = await apiPost("/auth/refresh");
      logger.debug("[SELECT-ROLE] Token refreshed", refreshResponse);

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error: unknown) {
      logger.error("[SELECT-ROLE] Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to select role",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">Choose your role</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select how you&apos;ll use the platform to personalize your experience
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <Card
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={cn(
                "relative cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected
                  ? "ring-2 ring-primary shadow-md"
                  : "hover:border-primary/30",
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {role.title}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5 mt-4">
                  {role.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Button
          onClick={handleSelectRole}
          disabled={!selectedRole || isSubmitting}
          size="lg"
          className="px-10 cursor-pointer"
        >
          {isSubmitting ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
