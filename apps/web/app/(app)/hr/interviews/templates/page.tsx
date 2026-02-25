import { TemplatesList } from '@/features/templates/components/TemplatesList';

export const metadata = {
  title: 'Interview Templates | AI Video Interview',
  description: 'Create and manage AI-powered interview templates',
};

export default function TemplatesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Interview Templates</h1>
        <p className="text-white/80">
          Create and manage AI-powered interview templates
        </p>
      </div>
      <TemplatesList />
    </div>
  );
}