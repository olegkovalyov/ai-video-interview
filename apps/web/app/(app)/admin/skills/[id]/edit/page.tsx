'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getSkill, updateSkill, listCategories, type Skill, type SkillCategory } from '@/lib/api/skills';
import { toast } from 'sonner';

export default function EditSkillPage() {
  const router = useRouter();
  const params = useParams();
  const skillId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [skillData, categoriesData] = await Promise.all([
          getSkill(skillId),
          listCategories(),
        ]);
        
        setSkill(skillData);
        setCategories(categoriesData);
        setFormData({
          name: skillData.name,
          categoryId: skillData.categoryId,
          description: skillData.description || '',
        });
      } catch (error: any) {
        toast.error(error.message || 'Failed to load skill');
        router.push('/admin/skills');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [skillId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Skill name is required');
      return;
    }

    setSaving(true);
    try {
      await updateSkill(skillId, formData);
      toast.success('Skill updated successfully');
      router.push('/admin/skills');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update skill');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-white/80">Loading skill...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!skill) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/skills"
            className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Skills
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Edit Skill
          </h1>
          <p className="text-white/80">
            Update skill information
          </p>
        </div>

        {/* Form */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Skill Name */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Skill Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. React, TypeScript, Docker"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  required
                />
              </div>

              {/* Slug (read-only) */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={skill.slug}
                  disabled
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white/50 cursor-not-allowed"
                />
                <p className="text-white/60 text-sm mt-1">
                  Slug cannot be changed after creation
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 cursor-pointer"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-gray-800">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the skill..."
                  rows={4}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none"
                />
              </div>

              {/* Metadata */}
              <div className="border-t border-white/20 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
                  <div>
                    <span className="font-medium">Created:</span> {new Date(skill.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span> {new Date(skill.updatedAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {skill.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </div>
                  <div>
                    <span className="font-medium">Used by:</span> {skill.candidatesCount} candidates
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Link href="/admin/skills">
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
