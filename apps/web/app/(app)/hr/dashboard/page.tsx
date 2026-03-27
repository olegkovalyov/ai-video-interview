'use client';

import Link from 'next/link';
import { useHRInvitations } from '@/lib/query/hooks/use-invitations';
import { useActiveTemplates } from '@/lib/query/hooks/use-templates';
import {
  Loader2,
  Users,
  CheckCircle,
  FileText,
  Play,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function HRDashboardPage() {
  const { data: invitationsData, isPending: invitationsLoading } = useHRInvitations({ limit: 100 });
  const { data: templates, isPending: templatesLoading } = useActiveTemplates();

  const loading = invitationsLoading || templatesLoading;
  const invitations = invitationsData?.items ?? [];

  const stats = {
    activeInterviews: invitations.filter(i => i.status === 'in_progress').length,
    pendingReviews: invitations.filter(i => i.status === 'completed').length,
    totalInvitations: invitations.length,
    templatesCount: templates?.length ?? 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            HR Dashboard
          </h1>
          <p className="text-lg text-white/80">
            Overview of your recruitment activities
          </p>
        </div>

        {/* Alert: Pending Reviews */}
        {stats.pendingReviews > 0 && (
          <div className="mb-8 p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-white font-medium">
                    {stats.pendingReviews} candidate{stats.pendingReviews > 1 ? 's' : ''} waiting for review
                  </p>
                  <p className="text-white/70 text-sm">
                    Completed interviews need your evaluation
                  </p>
                </div>
              </div>
              <Link
                href="/hr/interviews/review"
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                Review Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link
            href="/hr/interviews/invitations"
            className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <Play className="w-5 h-5 text-blue-400" />
              <h3 className="text-white/80 text-sm font-medium">Active Interviews</h3>
            </div>
            <p className="text-4xl font-bold text-white">{stats.activeInterviews}</p>
          </Link>

          <Link
            href="/hr/interviews/review"
            className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-white/80 text-sm font-medium">Pending Reviews</h3>
            </div>
            <p className="text-4xl font-bold text-white">{stats.pendingReviews}</p>
          </Link>

          <Link
            href="/hr/interviews/invitations"
            className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-white/80 text-sm font-medium">Total Invitations</h3>
            </div>
            <p className="text-4xl font-bold text-white">{stats.totalInvitations}</p>
          </Link>

          <Link
            href="/hr/interviews/templates"
            className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white/80 text-sm font-medium">Templates</h3>
            </div>
            <p className="text-4xl font-bold text-white">{stats.templatesCount}</p>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/hr/interviews/candidates"
              className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-white font-medium">Invite Candidate</p>
                <p className="text-white/60 text-sm">Search and send invitations</p>
              </div>
            </Link>

            <Link
              href="/hr/interviews/templates/create"
              className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-white font-medium">Create Template</p>
                <p className="text-white/60 text-sm">Design new interview</p>
              </div>
            </Link>

            <Link
              href="/hr/companies"
              className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-white font-medium">Manage Companies</p>
                <p className="text-white/60 text-sm">Add or edit companies</p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
