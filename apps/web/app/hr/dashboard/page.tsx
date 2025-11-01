"use client";
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function HRDashboardPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ myInterviews: 8, activeCandidates: 23, pendingReviews: 12 });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await apiGet("/protected") as { user: any };
        setUser(res.user);
      } catch (e: any) {
        if (e.message?.includes('401')) {
          router.replace("/login");
        } else {
          setError("Failed to load user data");
        }
      }
    };

    loadUserData();
  }, [router]);


  return (
    <ProtectedRoute requireHR={true}>
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">

      <main className="container mx-auto px-6 py-12">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

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
          {/* Create Interview */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="text-5xl mb-4">➕</div>
              <h3 className="text-xl font-semibold text-white mb-3">Create Interview</h3>
              <p className="text-white/80 mb-6 leading-relaxed flex-grow">
                Set up a new video interview with custom questions
              </p>
              <Button asChild variant="brand" className="w-full mt-auto">
                <Link href="/interviews/create">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          {/* My Interviews */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-3">My Interviews</h3>
              <p className="text-white/80 mb-6 leading-relaxed flex-grow">
                View and manage all your interviews
              </p>
              <Button asChild variant="glass" className="w-full mt-auto">
                <Link href="/interviews">View All</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Candidates */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-white mb-3">Candidates</h3>
              <p className="text-white/80 mb-6 leading-relaxed flex-grow">
                Review candidate responses and scores
              </p>
              <Button asChild variant="glass" className="w-full mt-auto">
                <Link href="/hr/candidates">View Candidates</Link>
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
      </main>
    </div>
    </ProtectedRoute>
  );
}
