"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillStatsCards } from "./SkillStatsCards";
import { SkillFiltersComponent } from "./SkillFilters";
import { SkillsTable } from "./SkillsTable";
import {
  useSkills,
  useSkillCategories,
  useToggleSkillStatus,
  useDeleteSkill,
} from "@/lib/query/hooks/use-skills";
import { toast } from "sonner";

export function SkillsList() {
  const router = useRouter();
  const [loadingSkills, setLoadingSkills] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: categoriesData } = useSkillCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const {
    data: skillsResponse,
    isPending: loading,
  } = useSkills({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    categoryId: categoryFilter || undefined,
    isActive:
      statusFilter === "all" ? undefined : statusFilter === "active",
  });

  const skills = skillsResponse?.data ?? [];
  const total = skillsResponse?.pagination?.total ?? 0;

  const toggleMutation = useToggleSkillStatus();
  const deleteMutation = useDeleteSkill();

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const handleToggleStatus = async (skillId: string) => {
    setLoadingSkills((prev) => new Set(prev).add(skillId));
    toggleMutation.mutate(skillId, {
      onSettled: () => {
        setLoadingSkills((prev) => {
          const next = new Set(prev);
          next.delete(skillId);
          return next;
        });
      },
    });
  };

  const handleEdit = (skillId: string) => {
    router.push(`/admin/skills/${skillId}/edit`);
  };

  const handleDelete = async (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return;
    if (
      !confirm(
        `Are you sure you want to delete "${skill.name}"? This action cannot be undone.`,
      )
    )
      return;

    setLoadingSkills((prev) => new Set(prev).add(skillId));
    deleteMutation.mutate(skillId, {
      onSettled: () => {
        setLoadingSkills((prev) => {
          const next = new Set(prev);
          next.delete(skillId);
          return next;
        });
      },
    });
  };

  const stats = {
    total,
    active: skills.filter((s) => s.isActive).length,
    inactive: skills.filter((s) => !s.isActive).length,
    totalCategories: categories.length,
  };

  const totalPages = Math.max(1, Math.ceil(total / 20) || 1);

  return (
    <>
      <SkillStatsCards stats={stats} />

      <SkillFiltersComponent
        filters={{
          search: searchQuery,
          categoryId: categoryFilter,
          status: statusFilter,
        }}
        categories={categories}
        onSearchChange={setSearchQuery}
        onCategoryChange={(id) => {
          setPage(1);
          setCategoryFilter(id);
        }}
        onStatusChange={(status) => {
          setPage(1);
          setStatusFilter(status);
        }}
      />

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Found {total} skill{total !== 1 ? "s" : ""}
        </span>
        {(searchQuery || categoryFilter || statusFilter !== "all") && (
          <span>(filtered)</span>
        )}
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      <SkillsTable
        skills={skills}
        onToggleStatus={handleToggleStatus}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loadingSkills={loadingSkills}
      />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
