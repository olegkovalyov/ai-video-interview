'use client';

import { ProtectedRoute } from '@/features/auth';

export default function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireHR={true}>
      {children}
    </ProtectedRoute>
  );
}
