'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateStatsCards } from './TemplateStatsCards';
import { TemplateFilters } from './TemplateFilters';
import { TemplatesTable } from './TemplatesTable';
import { EmptyState } from './EmptyState';
import {
  useTemplates,
  useTemplateStats,
  usePublishTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
} from '@/lib/query/hooks/use-templates';
import { TemplateStatus } from '../types/template.types';

export function TemplatesList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | 'all'>('all');

  const { data: templatesData, isPending, isFetching } = useTemplates({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery,
  });

  const { data: stats = { total: 0, active: 0, draft: 0, archived: 0 }, isPending: isStatsPending } =
    useTemplateStats();

  const templates = templatesData?.items ?? [];

  const publishMutation = usePublishTemplate();
  const deleteMutation = useDeleteTemplate();
  const duplicateMutation = useDuplicateTemplate();

  const loadingTemplates = new Set<string>(
    [publishMutation, deleteMutation, duplicateMutation]
      .filter((m) => m.isPending && m.variables)
      .map((m) => m.variables as string),
  );

  // Handlers
  const handleView = (templateId: string) => {
    router.push(`/hr/templates/${templateId}`);
  };

  const handleEdit = (templateId: string) => {
    router.push(`/hr/templates/${templateId}/edit`);
  };

  const handleDuplicate = (templateId: string) => {
    duplicateMutation.mutate(templateId);
  };

  const handlePublish = (templateId: string) => {
    publishMutation.mutate(templateId);
  };

  const handleArchive = (templateId: string) => {
    deleteMutation.mutate(templateId);
  };

  const handleDelete = (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    deleteMutation.mutate(templateId);
  };

  const handleCreateClick = () => {
    router.push('/hr/templates/create');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <TemplateStatsCards stats={stats} loading={isStatsPending} />

      {/* Filters */}
      <TemplateFilters
        search={searchQuery}
        status={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onCreateClick={handleCreateClick}
      />

      {/* Results count */}
      {!isPending && (
        <div className="text-white/80 text-sm">
          Showing {templates.length} of {stats.total} template
          {stats.total !== 1 ? 's' : ''}
          {(statusFilter !== 'all' || searchQuery) && (
            <span className="ml-2 text-white/60">(filtered)</span>
          )}
        </div>
      )}

      {/* Table */}
      {isPending ? (
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
