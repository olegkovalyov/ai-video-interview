"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHRInvitations } from "@/lib/query/hooks/use-invitations";

export default function HRDashboardPage() {
  const { data } = useHRInvitations({ limit: 100 });
  const invitations = data?.items ?? [];
  const stats = {
    myInterviews: invitations.length,
    activeCandidates: invitations.filter(i => i.status === 'in_progress' || i.status === 'pending').length,
    pendingReviews: invitations.filter(i => i.status === 'completed').length,
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">

      <div className="container mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            HR Dashboard 👔
          </h1>
          <p className="text-lg text-white/80">
            Manage interviews and evaluate candidates
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.myInterviews}</div>
              <div className="text-sm text-white/80">My Interviews</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{stats.activeCandidates}</div>
              <div className="text-sm text-white/80">Active Candidates</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.pendingReviews}</div>
              <div className="text-sm text-white/80">Pending Reviews</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Templates */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-white mb-3">Templates</h3>
              <p className="text-white/80 mb-6 leading-relaxed flex-grow">
                Create and manage interview templates
              </p>
              <Button asChild variant="default" className="w-full mt-auto">
                <Link href="/hr/templates">Manage Templates</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Candidates */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-white mb-3">Candidates</h3>
              <p className="text-white/80 mb-6 leading-relaxed flex-grow">
                Search candidates and send interview invitations
              </p>
              <Button asChild variant="outline" className="w-full mt-auto">
                <Link href="/hr/candidates">Find Candidates</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Companies */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="text-5xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-white mb-3">Companies</h3>
              <p className="text-white/80 mb-6 leading-relaxed flex-grow">
                Manage your companies and positions
              </p>
              <Button asChild variant="outline" className="w-full mt-auto">
                <Link href="/hr/companies">View Companies</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Recent Candidates</h2>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🎯</div>
              <p className="text-white/80 text-lg">
                No recent submissions yet. Create your first interview to get started!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
