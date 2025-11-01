'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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
