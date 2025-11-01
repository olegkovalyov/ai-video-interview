"use client";

import { CandidatesList } from '@/features/candidates';

export default function CandidatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Candidates</h1>
          <p className="text-lg text-white/80">
            View and manage all candidate applications and interview results
          </p>
        </div>

        <CandidatesList />
      </main>
    </div>
  );
}
