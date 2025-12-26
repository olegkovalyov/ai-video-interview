import { use } from 'react';
import { redirect } from 'next/navigation';

interface EditTemplateRedirectProps {
  params: Promise<{ id: string }>;
}

export default function EditTemplateRedirectPage({ params }: EditTemplateRedirectProps) {
  const { id } = use(params);
  redirect(`/hr/interviews/templates/${id}/edit`);
}
