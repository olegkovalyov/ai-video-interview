import { SkillsList } from "@/features/skills";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminSkillsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Skills Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage technical skills for candidates
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/skills/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Skill
          </Link>
        </Button>
      </div>

      <SkillsList />
    </div>
  );
}
