"use client";

import { Edit2, Trash2, Building2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Company } from "@/lib/api/companies";

interface CompaniesTableProps {
  companies: Company[];
  onEdit: (companyId: string) => void;
  onDelete: (companyId: string) => void;
  loadingCompanies?: Set<string>;
}

export function CompaniesTable({
  companies,
  onEdit,
  onDelete,
  loadingCompanies = new Set(),
}: CompaniesTableProps) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <h3 className="text-sm font-medium text-foreground mb-1">
          No companies yet
        </h3>
        <p className="text-xs text-muted-foreground">
          Create your first company to start sending invitations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {companies.map((company) => {
        const isLoading = loadingCompanies.has(company.id);

        return (
          <Card
            key={company.id}
            className={`transition-all hover:shadow-md hover:border-primary/30 ${isLoading ? "opacity-50" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground">
                        {company.name}
                      </p>
                      <Badge variant="info">{company.industry}</Badge>
                      <Badge variant="warning">{company.size}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {company.location && <span>{company.location}</span>}
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(company.id)}
                    disabled={isLoading}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(company.id)}
                    disabled={isLoading}
                    className="text-error hover:text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
