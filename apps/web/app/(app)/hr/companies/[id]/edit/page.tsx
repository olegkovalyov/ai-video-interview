'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCompanySizeOptions } from '@/lib/api/companies';
import { useCompany, useUpdateCompany } from '@/lib/query/hooks/use-companies';

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  const sizeOptions = getCompanySizeOptions();

  const { data: company, isPending } = useCompany(companyId);
  const updateMutation = useUpdateCompany();

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: sizeOptions[0],
    website: '',
    description: '',
    location: '',
  });

  // Populate form when company data loads
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        industry: company.industry,
        size: company.size,
        website: company.website || '',
        description: company.description || '',
        location: company.location || '',
      });
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.industry.trim()) {
      return;
    }

    updateMutation.mutate(
      { id: companyId, dto: formData },
      {
        onSuccess: () => {
          router.push('/hr/companies');
        },
      },
    );
  };

  if (isPending) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading company...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/hr/companies"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Edit Company
          </h1>
          <p className="text-muted-foreground">
            Update company information
          </p>
        </div>

        {/* Form */}
        <Card className="">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Company Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. TechCorp Inc."
                  className="w-full px-4 py-2  text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Industry <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g. Software Development, AI/ML, FinTech"
                  className="w-full px-4 py-2  text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Company Size <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full px-4 py-2  text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  required
                >
                  {sizeOptions.map(size => (
                    <option key={size} value={size} className="bg-gray-800">
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://company.com"
                  className="w-full px-4 py-2  text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-4 py-2  text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the company..."
                  rows={4}
                  className="w-full px-4 py-2  text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              {/* Metadata */}
              <div className="border-t border-white/20 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Created:</span> {new Date(company.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span> {new Date(company.updatedAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {company.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Link href="/hr/companies">
                  <Button
                    type="button"
                    variant="outline"
                    className=""
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className=""
                >
                  {updateMutation.isPending ? (
                    <>Saving...</>
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
    </div>
  );
}
