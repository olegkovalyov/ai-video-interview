import { CandidateCompletedTab } from '@/features/hr-candidates/components/CandidateCompletedTab';

export const metadata = {
  title: 'Review Interviews | AI Video Interview',
  description: 'Review completed interviews and evaluate candidates',
};

export default function ReviewPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Review</h1>
        <p className="text-white/80">
          Review completed interviews and evaluate candidates
        </p>
      </div>
      <CandidateCompletedTab />
    </div>
  );
}
