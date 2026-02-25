import { redirect } from 'next/navigation';

// Redirect to main candidates page with search tab
export default function CandidateSearchPage() {
  redirect('/hr/candidates');
}
