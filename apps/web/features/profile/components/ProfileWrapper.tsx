"use client";

import { ProtectedRoute } from '@/features/auth';

export function ProfileWrapper({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
