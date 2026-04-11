import { TemplatesList } from "@/features/templates/components/TemplatesList";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Interview Templates | AI Video Interview",
  description: "Create and manage AI-powered interview templates",
};

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Interview Templates
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage AI-powered interview templates
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/hr/templates/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>
      <TemplatesList />
    </div>
  );
}
