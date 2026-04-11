import { CreateTemplateWizard } from '@/features/templates/components/CreateTemplateWizard/CreateTemplateWizard';

export const metadata = {
  title: 'Create Interview Template | AI Video Interview',
  description: 'Create a new interview template with custom questions and settings',
};

export default function CreateTemplatePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Interview Template</h1>
        <p className="text-white/80">
          Follow the steps to create your custom interview template
        </p>
      </div>
      <CreateTemplateWizard />
    </div>
  );
}
