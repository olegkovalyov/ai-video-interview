"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export function ProfileWrapper({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
