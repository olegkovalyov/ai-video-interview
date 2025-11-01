"use client";

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/features/auth';
import { InterviewsGrid } from '@/features/interviews';

export default function InterviewsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
        <main className="container mx-auto px-6 py-12">
          {/* Page Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Interviews</h1>
              <p className="text-lg text-white/80">Manage your AI-powered video interview templates</p>
            </div>
            <Button asChild variant="brand" size="lg">
              <Link href="/interviews/create" className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create Interview</span>
              </Link>
            </Button>
          </div>

          <InterviewsGrid />
        </main>
      </div>
    </ProtectedRoute>
  );
}
