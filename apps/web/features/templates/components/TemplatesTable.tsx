import {
  Eye,
  Edit2,
  Copy,
  CheckCircle,
  Archive,
  Trash2,
  MoreVertical,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Template } from "../types/template.types";
import { TemplateStatusBadge } from "./TemplateStatusBadge";
import { formatDateRelative, formatDuration } from "../utils/template-helpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-sm font-medium text-foreground mb-1">
            No templates found
          </h3>
          <p className="text-xs text-muted-foreground">
            Create your first interview template to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  Template Name
                </th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="p-3 text-center text-xs font-medium text-muted-foreground">
                  Questions
                </th>
                <th className="p-3 text-center text-xs font-medium text-muted-foreground">
                  Duration
                </th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                  Created
                </th>
                <th className="p-3 text-right text-xs font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => {
                const isLoading = loadingTemplates.has(template.id);
                return (
                  <tr
                    key={template.id}
                    className={cn(
                      "border-b last:border-0 hover:bg-muted/30 transition-colors",
                      isLoading && "opacity-50",
                    )}
                  >
                    <td className="p-3 max-w-md">
                      <div className="text-sm font-medium text-foreground">
                        {template.title}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {template.description}
                      </div>
                    </td>
                    <td className="p-3">
                      <TemplateStatusBadge status={template.status} />
                    </td>
                    <td className="p-3 text-center text-sm text-foreground">
                      {template.questionsCount}
                    </td>
                    <td className="p-3 text-center text-sm text-muted-foreground">
                      {template.settings
                        ? formatDuration(template.settings.totalTimeLimit)
                        : "\u2014"}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatDateRelative(template.createdAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isLoading}
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onView(template.id)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEdit(template.id)}
                              className="cursor-pointer"
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDuplicate(template.id)}
                              className="cursor-pointer"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {template.status === "draft" && (
                              <DropdownMenuItem
                                onClick={() => onPublish(template.id)}
                                className="cursor-pointer text-success focus:text-success"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {template.status === "active" && (
                              <DropdownMenuItem
                                onClick={() => onArchive(template.id)}
                                className="cursor-pointer text-warning focus:text-warning"
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(template.id)}
                              className="cursor-pointer text-destructive focus:text-destructive"
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
