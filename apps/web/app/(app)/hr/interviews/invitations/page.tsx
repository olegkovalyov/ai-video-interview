import { CandidateInvitedTab } from '@/features/hr-candidates/components/CandidateInvitedTab';

export const metadata = {
  title: 'Invitations | AI Video Interview',
  description: 'Track interview invitations and progress',
};

export default function InvitationsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Invitations</h1>
        <p className="text-white/80">
          Track interview invitations and candidate progress
        </p>
      </div>
      <CandidateInvitedTab />
    </div>
  );
}
