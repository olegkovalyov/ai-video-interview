"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CompaniesTable } from "./CompaniesTable";
import {
  useCompanies,
  useDeleteCompany,
} from "@/lib/query/hooks/use-companies";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export function CompaniesList() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isPending, isFetching } = useCompanies({
    search: debouncedSearch || undefined,
  });
  const deleteMutation = useDeleteCompany();

  const companies = data?.data ?? [];
  const loadingCompanies = new Set(
    deleteMutation.isPending && deleteMutation.variables
      ? [deleteMutation.variables]
      : [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleEdit = (companyId: string) => {
    router.push(`/hr/companies/${companyId}/edit`);
  };

  const handleDelete = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (!company) return;
    if (
      !confirm(
        `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(companyId);
  };

  return (
    <>
      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search companies..."
            aria-label="Search companies"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      {!isPending && (
        <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
          {companies.length} compan{companies.length !== 1 ? "ies" : "y"}
          {debouncedSearch && ` matching "${debouncedSearch}"`}
        </p>
      )}

      {isPending ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <CompaniesTable
          companies={companies}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loadingCompanies={loadingCompanies}
        />
      )}
    </>
  );
}
