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
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        <EditTemplateForm templateId={id} />
      </main>
    </div>
  );
}
