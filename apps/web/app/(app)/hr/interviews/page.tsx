import { TemplatesList } from '@/features/templates/components/TemplatesList';

export const metadata = {
  title: 'Interview Templates | AI Video Interview',
  description: 'Create and manage AI-powered interview templates',
};

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Interview Templates</h1>
          <p className="text-lg text-white/80">
            Create and manage AI-powered interview templates
          </p>
        </div>

        {/* Templates List */}
        <TemplatesList />
      </main>
    </div>
  );
}
