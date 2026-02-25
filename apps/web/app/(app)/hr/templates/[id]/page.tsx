import { use } from 'react';
import { redirect } from 'next/navigation';

interface TemplateDetailRedirectProps {
  params: Promise<{ id: string }>;
}

export default function TemplateDetailRedirectPage({ params }: TemplateDetailRedirectProps) {
  const { id } = use(params);
  redirect(`/hr/interviews/templates/${id}`);
}
