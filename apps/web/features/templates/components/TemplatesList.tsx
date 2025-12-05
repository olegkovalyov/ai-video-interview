'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TemplateStatsCards } from './TemplateStatsCards';
import { TemplateFilters } from './TemplateFilters';
import { TemplatesTable } from './TemplatesTable';
import { EmptyState } from './EmptyState';
import {
  listTemplates,
  getTemplateStats,
  publishTemplate,
  deleteTemplate,
  duplicateTemplate,
} from '../services/templates-api';
import { Template, TemplateStats, TemplateStatus } from '../types/template.types';

export function TemplatesList() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<TemplateStats>({
    total: 0,
    active: 0,
    draft: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | 'all'>('all');
  const isFetchingRef = useRef(false);

  // Fetch templates and stats
  const fetchData = useCallback(async () => {
    // Prevent duplicate requests
    if (isFetchingRef.current) {
      console.log('⏭️ Skipping duplicate fetch request');
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const [templatesData, statsData] = await Promise.all([
        listTemplates(1, 100, {
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchQuery,
        }),
        getTemplateStats(),
      ]);
      setTemplates(templatesData.items);
      setStats(statsData);
    } catch (error: any) {
      console.error('🔴 Failed to fetch templates:', error);
      
      // Show user-friendly message
      const errorMessage = error?.message || 'Failed to load templates. Please try again.';
      toast.error(errorMessage);
      
      // Set empty state gracefully
      setTemplates([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Row-level locking helper
  const withTemplateLock = async <T,>(
    templateId: string,
    action: () => Promise<T>,
  ): Promise<T | void> => {
    setLoadingTemplates((prev) => new Set(prev).add(templateId));
    try {
      const result = await action();
      await fetchData(); // Refresh data
      return result;
    } catch (error: any) {
      console.error('Operation failed:', error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoadingTemplates((prev) => {
        const next = new Set(prev);
        next.delete(templateId);
        return next;
      });
    }
  };

  // Handlers
  const handleView = (templateId: string) => {
    router.push(`/hr/templates/${templateId}`);
  };

  const handleEdit = (templateId: string) => {
    router.push(`/hr/templates/${templateId}/edit`);
  };

  const handleDuplicate = async (templateId: string) => {
    await withTemplateLock(templateId, async () => {
      const result = await duplicateTemplate(templateId);
      toast.success('Template duplicated successfully');
      return result;
    });
  };

  const handlePublish = async (templateId: string) => {
    await withTemplateLock(templateId, async () => {
      await publishTemplate(templateId);
      toast.success('Template published successfully');
    });
  };

  const handleArchive = async (templateId: string) => {
    await withTemplateLock(templateId, async () => {
      await deleteTemplate(templateId);
      toast.success('Template archived');
    });
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    await withTemplateLock(templateId, async () => {
      await deleteTemplate(templateId);
      toast.success('Template deleted');
    });
  };

  const handleCreateClick = () => {
    router.push('/hr/templates/create');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <TemplateStatsCards stats={stats} loading={loading} />

      {/* Filters */}
      <TemplateFilters
        search={searchQuery}
        status={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onCreateClick={handleCreateClick}
      />

      {/* Results count */}
      {!loading && (
        <div className="text-white/80 text-sm">
          Showing {templates.length} of {stats.total} template
          {stats.total !== 1 ? 's' : ''}
          {(statusFilter !== 'all' || searchQuery) && (
            <span className="ml-2 text-white/60">(filtered)</span>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          title={searchQuery || statusFilter !== 'all' ? 'No templates found' : 'No templates yet'}
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Create your first interview template to get started'
          }
        />
      ) : (
        <TemplatesTable
          templates={templates}
          onView={handleView}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onPublish={handlePublish}
          onArchive={handleArchive}
          onDelete={handleDelete}
          loadingTemplates={loadingTemplates}
        />
      )}
    </div>
  );
}
