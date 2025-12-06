'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCompany, updateCompany, getCompanySizeOptions, type Company } from '@/lib/api/companies';
import { toast } from 'sonner';

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const sizeOptions = getCompanySizeOptions();
  
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: sizeOptions[0],
    website: '',
    description: '',
    location: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const companyData = await getCompany(companyId);
        
        setCompany(companyData);
        setFormData({
          name: companyData.name,
          industry: companyData.industry,
          size: companyData.size,
          website: companyData.website || '',
          description: companyData.description || '',
          location: companyData.location || '',
        });
      } catch (error: any) {
        toast.error(error.message || 'Failed to load company');
        router.push('/hr/companies');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [companyId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    
    if (!formData.industry.trim()) {
      toast.error('Industry is required');
      return;
    }

    setSaving(true);
    try {
      await updateCompany(companyId, formData);
      toast.success('Company updated successfully');
      router.push('/hr/companies');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-white/80">Loading company...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/hr/companies"
            className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Edit Company
          </h1>
          <p className="text-white/80">
            Update company information
          </p>
        </div>

        {/* Form */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. TechCorp Inc."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  required
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Industry <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g. Software Development, AI/ML, FinTech"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  required
                />
              </div>

              {/* Size */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Company Size <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 cursor-pointer"
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
                <label className="block text-white font-medium mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://company.com"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the company..."
                  rows={4}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none"
                />
              </div>

              {/* Metadata */}
              <div className="border-t border-white/20 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
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
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
                >
                  {saving ? (
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
