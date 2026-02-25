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
  
  // Pagination & server-side search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch skills and categories
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [skillsResponse, categoriesData] = await Promise.all([
        listSkills({
          page,
          limit: pageSize,
          search: debouncedSearch || undefined,
          categoryId: categoryFilter || undefined,
          isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        }),
        listCategories(),
      ]);
      
      setSkills(skillsResponse.data);
      setTotal(skillsResponse.pagination.total);
      // Safety check: ensure categoriesData is an array
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error: any) {
      console.error('Failed to fetch skills:', error);
      
      // Check if it's a User Service unavailable error
      if (error?.message?.includes('unavailable') || error?.message?.includes('ECONNREFUSED')) {
        toast.error('User Service is not running. Skills functionality requires User Service.');
      } else {
        toast.error(error?.message || 'Failed to load skills');
      }
      
      // Set empty states on error
      setSkills([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce поиска, чтобы не спамить запросами на каждый символ
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1); // при новом поиске сбрасываемся на первую страницу
    }, 300);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, debouncedSearch, categoryFilter, statusFilter]);

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

  // Calculate stats (based on all loaded skills, not filtered)
  const stats = {
    total: total,
    active: skills.filter(s => s.isActive).length,
    inactive: skills.filter(s => !s.isActive).length,
    totalCategories: categories.length,
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  const handleCategoryChange = (categoryId: string) => {
    setPage(1);
    setCategoryFilter(categoryId);
  };

  const handleStatusChange = (status: 'all' | 'active' | 'inactive') => {
    setPage(1);
    setStatusFilter(status);
  };

  return (
    <>
      <SkillStatsCards stats={stats} />

      <SkillFiltersComponent
        filters={{ search: searchQuery, categoryId: categoryFilter, status: statusFilter }}
        categories={categories}
        onSearchChange={setSearchQuery}
        onCategoryChange={handleCategoryChange}
        onStatusChange={handleStatusChange}
      />

      {/* Results Count */}
      <div className="mb-4 text-white/80">
        Found {total} skill{total !== 1 ? 's' : ''}
        {(searchQuery || categoryFilter || statusFilter !== 'all') && (
          <span className="ml-2 text-white/60">
            (filtered)
          </span>
        )}
        {loading && (
          <span className="ml-2 text-white/60">
            • Loading...
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

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-end gap-4 text-white/80">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            className="px-3 py-1 rounded border border-white/30 bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            className="px-3 py-1 rounded border border-white/30 bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
