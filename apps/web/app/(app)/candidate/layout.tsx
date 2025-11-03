'use client';

import { ProtectedRoute } from '@/features/auth';

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
