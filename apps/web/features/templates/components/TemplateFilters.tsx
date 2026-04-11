import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TemplateStatus } from "../types/template.types";

interface TemplateFiltersProps {
  search: string;
  status: TemplateStatus | "all";
  onSearchChange: (search: string) => void;
  onStatusChange: (status: TemplateStatus | "all") => void;
  onCreateClick: () => void;
}

const selectClass =
  "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function TemplateFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: TemplateFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search templates..."
              aria-label="Search templates"
              className="pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) =>
              onStatusChange(e.target.value as TemplateStatus | "all")
            }
            aria-label="Filter by status"
            className={selectClass}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
