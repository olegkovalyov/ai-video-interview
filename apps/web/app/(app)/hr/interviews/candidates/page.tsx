import { CandidateSearchTab } from '@/features/hr-candidates/components/CandidateSearchTab';

export const metadata = {
  title: 'Search Candidates | AI Video Interview',
  description: 'Search and invite candidates for interviews',
};

export default function CandidatesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Candidates</h1>
        <p className="text-white/80">
          Search and invite candidates for interviews
        </p>
      </div>
      <CandidateSearchTab />
    </div>
  );
}
