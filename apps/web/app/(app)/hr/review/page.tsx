import { CandidateCompletedTab } from "@/features/hr-candidates/components/CandidateCompletedTab";

export const metadata = {
  title: "Review Interviews | AI Video Interview",
  description: "Review completed interviews and evaluate candidates",
};

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Review
        </h1>
        <p className="text-sm text-muted-foreground">
          Review completed interviews and evaluate candidates
        </p>
      </div>
      <CandidateCompletedTab />
    </div>
  );
}
