import { TemplateStatus } from '../types/template.types';
import { getStatusColor, getStatusIcon } from '../utils/template-helpers';

interface TemplateStatusBadgeProps {
  status: TemplateStatus;
  showIcon?: boolean;
}

export function TemplateStatusBadge({ status, showIcon = true }: TemplateStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(status)}`}
    >
      {showIcon && <span>{getStatusIcon(status)}</span>}
      <span className="capitalize">{status}</span>
    </span>
  );
}
