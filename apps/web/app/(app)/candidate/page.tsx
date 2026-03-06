"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCandidateInvitations } from "@/lib/query/hooks/use-invitations";

export default function CandidateDashboardPage() {
  const { data } = useCandidateInvitations({ limit: 100 });
  const invitations = data?.items ?? [];
  const stats = {
    invitations: invitations.filter(i => i.status === 'pending').length,
    completed: invitations.filter(i => i.status === 'completed').length,
    pending: invitations.filter(i => i.status === 'in_progress').length,
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">

      <div className="container mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            My Interviews 🎓
          </h1>
          <p className="text-lg text-white/80">
            View your interview invitations and submissions
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.invitations}</div>
              <div className="text-sm text-white/80">New Invitations</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{stats.completed}</div>
              <div className="text-sm text-white/80">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.pending}</div>
              <div className="text-sm text-white/80">In Progress</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Active Invitations */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="text-5xl mb-4">📬</div>
              <h3 className="text-xl font-semibold text-white mb-3">Active Invitations</h3>
              <p className="text-white/80 mb-6 leading-relaxed flex-grow">
                View and start your pending interviews
              </p>
              <Button asChild variant="brand" className="w-full mt-auto">
                <Link href="/candidate/invitations">View Invitations</Link>
              </Button>
            </CardContent>
          </Card>

          {/* My Submissions */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="text-5xl mb-4">📹</div>
              <h3 className="text-xl font-semibold text-white mb-3">My Submissions</h3>
              <p className="text-white/80 mb-6 leading-relaxed flex-grow">
                Review your completed interview responses
              </p>
              <Button asChild variant="glass" className="w-full mt-auto">
                <Link href="/candidate/submissions">View All</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Profile */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="text-5xl mb-4">👤</div>
              <h3 className="text-xl font-semibold text-white mb-3">My Profile</h3>
              <p className="text-white/80 mb-6 leading-relaxed flex-grow">
                Update your profile and preferences
              </p>
              <Button asChild variant="glass" className="w-full mt-auto">
                <Link href="/profile">Edit Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Recent Activity</h2>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🎯</div>
              <p className="text-white/80 text-lg">
                No recent activity yet. Start your first interview!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
