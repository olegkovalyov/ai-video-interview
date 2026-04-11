import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SkillFilters, SkillCategory } from "../types/skill.types";

interface SkillFiltersProps {
  filters: SkillFilters;
  categories: SkillCategory[];
  onSearchChange: (search: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onStatusChange: (status: "all" | "active" | "inactive") => void;
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function SkillFiltersComponent({
  filters,
  categories,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: SkillFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search skills..."
              value={filters.search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={filters.categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={selectClass}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              onStatusChange(e.target.value as "all" | "active" | "inactive")
            }
            className={selectClass}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
