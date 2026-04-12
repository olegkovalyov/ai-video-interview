"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCompanySizeOptions } from "@/lib/api/companies";
import { useCompany, useUpdateCompany } from "@/lib/query/hooks/use-companies";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  const sizeOptions = getCompanySizeOptions();

  const { data: company, isPending } = useCompany(companyId);
  const updateMutation = useUpdateCompany();

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    size: sizeOptions[0],
    website: "",
    description: "",
    location: "",
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        industry: company.industry,
        size: company.size,
        website: company.website || "",
        description: company.description || "",
        location: company.location || "",
      });
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.industry.trim()) return;

    updateMutation.mutate(
      { id: companyId, dto: formData },
      { onSuccess: () => router.push("/hr/companies") },
    );
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/hr/companies"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Companies
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Edit Company
        </h1>
        <p className="text-sm text-muted-foreground">
          Update company information
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="mb-2">
                Company Name <span className="text-error">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. TechCorp Inc."
                required
              />
            </div>

            <div>
              <Label className="mb-2">
                Industry <span className="text-error">*</span>
              </Label>
              <Input
                value={formData.industry}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, industry: e.target.value }))
                }
                placeholder="e.g. Software Development, AI/ML, FinTech"
                required
              />
            </div>

            <div>
              <Label className="mb-2">
                Company Size <span className="text-error">*</span>
              </Label>
              <select
                value={formData.size}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, size: e.target.value }))
                }
                className={selectClass}
                required
              >
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="mb-2">Website</Label>
              <Input
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, website: e.target.value }))
                }
                placeholder="https://company.com"
              />
            </div>

            <div>
              <Label className="mb-2">Location</Label>
              <Input
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="e.g. San Francisco, CA"
              />
            </div>

            <div>
              <Label className="mb-2">Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the company..."
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Metadata */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  Created: {new Date(company.createdAt).toLocaleDateString()}
                </div>
                <div>
                  Updated: {new Date(company.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/hr/companies">Cancel</Link>
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
