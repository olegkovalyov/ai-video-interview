import { use } from 'react';
import { EditTemplateForm } from '@/features/templates/components/EditTemplateForm';

export const metadata = {
  title: 'Edit Interview Template | AI Video Interview',
  description: 'Edit interview template details, questions and settings',
};

interface EditTemplatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { id } = use(params);
  return (
    <div>
      <EditTemplateForm templateId={id} />
    </div>
  );
}
