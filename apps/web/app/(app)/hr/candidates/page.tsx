import { CandidateSearchTab } from "@/features/hr-candidates/components/CandidateSearchTab";

export const metadata = {
  title: "Search Candidates | AI Video Interview",
  description: "Search and invite candidates for interviews",
};

export default function CandidatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Candidates
        </h1>
        <p className="text-sm text-muted-foreground">
          Search and invite candidates for interviews
        </p>
      </div>
      <CandidateSearchTab />
    </div>
  );
}
