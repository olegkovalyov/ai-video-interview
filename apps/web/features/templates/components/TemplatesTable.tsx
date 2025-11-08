import { Eye, Edit2, Copy, CheckCircle, Archive, Trash2, MoreVertical, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Template } from '../types/template.types';
import { TemplateStatusBadge } from './TemplateStatusBadge';
import { formatDateRelative, formatDuration } from '../utils/template-helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TemplatesTableProps {
  templates: Template[];
  onView: (templateId: string) => void;
  onEdit: (templateId: string) => void;
  onDuplicate: (templateId: string) => void;
  onPublish: (templateId: string) => void;
  onArchive: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  loadingTemplates?: Set<string>;
}

export function TemplatesTable({
  templates,
  onView,
  onEdit,
  onDuplicate,
  onPublish,
  onArchive,
  onDelete,
  loadingTemplates = new Set(),
}: TemplatesTableProps) {
  if (templates.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-0">
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No templates found</h3>
            <p className="text-white/70">Create your first interview template to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/20">
              <tr>
                <th className="text-left p-4 text-white/70 font-semibold">Template Name</th>
                <th className="text-left p-4 text-white/70 font-semibold">Status</th>
                <th className="text-center p-4 text-white/70 font-semibold">Questions</th>
                <th className="text-center p-4 text-white/70 font-semibold">Duration</th>
                <th className="text-left p-4 text-white/70 font-semibold">Created</th>
                <th className="text-right p-4 text-white/70 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => {
                const isLoading = loadingTemplates.has(template.id);
                return (
                  <tr
                    key={template.id}
                    className={`
                      border-b border-white/10 hover:bg-white/5 transition-all duration-200
                      ${isLoading ? 'opacity-60 blur-[0.5px]' : ''}
                    `}
                  >
                    {/* Template Name + Description */}
                    <td className="p-4 max-w-md">
                      <div>
                        <div className="text-white font-semibold mb-1">{template.title}</div>
                        <div className="text-white/60 text-sm line-clamp-2">
                          {template.description}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <TemplateStatusBadge status={template.status} />
                    </td>

                    {/* Questions Count */}
                    <td className="p-4 text-center">
                      <span className="text-white/80 font-medium">{template.questionsCount}</span>
                    </td>

                    {/* Duration */}
                    <td className="p-4 text-center">
                      <span className="text-white/80">
                        {template.settings ? formatDuration(template.settings.totalTimeLimit) : '—'}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="p-4">
                      <span className="text-white/70 text-sm">
                        {formatDateRelative(template.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              disabled={isLoading}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <MoreVertical className="w-5 h-5 text-white/70" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-gray-900/95 backdrop-blur-md border-white/20"
                          >
                            {/* View */}
                            <DropdownMenuItem
                              onClick={() => onView(template.id)}
                              className="text-white hover:bg-white/10 cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>

                            {/* Edit */}
                            <DropdownMenuItem
                              onClick={() => onEdit(template.id)}
                              className="text-white hover:bg-white/10 cursor-pointer"
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit Template
                            </DropdownMenuItem>

                            {/* Duplicate */}
                            <DropdownMenuItem
                              onClick={() => onDuplicate(template.id)}
                              className="text-white hover:bg-white/10 cursor-pointer"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-white/10" />

                            {/* Publish (only for drafts) */}
                            {template.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => onPublish(template.id)}
                                className="text-green-400 hover:bg-white/10 cursor-pointer"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Publish
                              </DropdownMenuItem>
                            )}

                            {/* Archive (only for active) */}
                            {template.status === 'active' && (
                              <DropdownMenuItem
                                onClick={() => onArchive(template.id)}
                                className="text-orange-400 hover:bg-white/10 cursor-pointer"
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="bg-white/10" />

                            {/* Delete */}
                            <DropdownMenuItem
                              onClick={() => onDelete(template.id)}
                              className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
