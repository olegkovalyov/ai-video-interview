import { CreateTemplateWizard } from '@/features/templates/components/CreateTemplateWizard/CreateTemplateWizard';

export const metadata = {
  title: 'Create Interview Template | AI Video Interview',
  description: 'Create a new interview template with custom questions and settings',
};

export default function CreateTemplatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Create Interview Template</h1>
          <p className="text-lg text-white/80">
            Follow the steps to create your custom interview template
          </p>
        </div>

        {/* Wizard */}
        <CreateTemplateWizard />
      </main>
    </div>
  );
}
