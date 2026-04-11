import { CompaniesList } from "@/features/companies";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HRCompaniesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Companies
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your company profiles
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/hr/companies/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </div>
      <CompaniesList />
    </div>
  );
}
