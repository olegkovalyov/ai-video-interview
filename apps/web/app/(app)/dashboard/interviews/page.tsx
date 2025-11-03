"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewsList } from "@/features/interviews";

export default function InterviewsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Interviews</h1>
            <p className="text-lg text-white/80">Manage your video interviews and review candidate responses</p>
          </div>
          <Button asChild variant="brand" size="lg">
            <Link href="/dashboard/interviews/create">
              <Plus className="w-5 h-5 mr-2" />
              Create Interview
            </Link>
          </Button>
        </div>

        <InterviewsList />
      </main>
    </div>
  );
}
