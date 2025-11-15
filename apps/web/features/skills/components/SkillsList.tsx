'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SkillStatsCards } from './SkillStatsCards';
import { SkillFiltersComponent } from './SkillFilters';
import { SkillsTable } from './SkillsTable';
import { listSkills, listCategories, toggleSkillStatus, deleteSkill, type Skill, type SkillCategory } from '@/lib/api/skills';
import { toast } from 'sonner';

export function SkillsList() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Fetch skills and categories
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [skillsResponse, categoriesData] = await Promise.all([
        listSkills({
          search: searchQuery || undefined,
          categoryId: categoryFilter || undefined,
          isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        }),
        listCategories(),
      ]);
      
      setSkills(skillsResponse.data);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, categoryFilter, statusFilter]);

  // Row-level locking helper
  const withSkillLock = async <T,>(skillId: string, action: () => Promise<T>): Promise<T | void> => {
    setLoadingSkills(prev => new Set(prev).add(skillId));
    try {
      const result = await action();
      await fetchData(); // Refresh data
      return result;
    } catch (error: any) {
      console.error('Operation failed:', error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoadingSkills(prev => {
        const next = new Set(prev);
        next.delete(skillId);
        return next;
      });
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (skillId: string) => {
    await withSkillLock(skillId, async () => {
      await toggleSkillStatus(skillId);
      toast.success('Skill status updated');
    });
  };

  // Handle edit
  const handleEdit = (skillId: string) => {
    router.push(`/admin/skills/${skillId}/edit`);
  };

  // Handle delete
  const handleDelete = async (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;

    if (!confirm(`Are you sure you want to delete "${skill.name}"? This action cannot be undone.`)) {
      return;
    }

    await withSkillLock(skillId, async () => {
      await deleteSkill(skillId);
      toast.success('Skill deleted');
    });
  };

  // Calculate stats
  const stats = {
    total: skills.length,
    active: skills.filter(s => s.isActive).length,
    inactive: skills.filter(s => !s.isActive).length,
    totalCategories: categories.length,
    totalCandidatesUsingSkills: skills.reduce((sum, s) => sum + s.candidatesCount, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/80">Loading skills...</div>
      </div>
    );
  }

  return (
    <>
      <SkillStatsCards stats={stats} />

      <SkillFiltersComponent
        filters={{ search: searchQuery, categoryId: categoryFilter, status: statusFilter }}
        categories={categories}
        onSearchChange={setSearchQuery}
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Results Count */}
      <div className="mb-4 text-white/80">
        Found {skills.length} skill{skills.length !== 1 ? 's' : ''}
        {(categoryFilter || statusFilter !== 'all') && (
          <span className="ml-2 text-white/60">
            (filtered)
          </span>
        )}
      </div>

      <SkillsTable
        skills={skills}
        onToggleStatus={handleToggleStatus}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loadingSkills={loadingSkills}
      />
    </>
  );
}
