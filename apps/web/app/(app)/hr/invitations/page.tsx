import { CandidateInvitedTab } from "@/features/hr-candidates/components/CandidateInvitedTab";

export const metadata = {
  title: "Invitations | AI Video Interview",
  description: "Track interview invitations and progress",
};

export default function InvitationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Invitations
        </h1>
        <p className="text-sm text-muted-foreground">
          Track interview invitations and candidate progress
        </p>
      </div>
      <CandidateInvitedTab />
    </div>
  );
}
