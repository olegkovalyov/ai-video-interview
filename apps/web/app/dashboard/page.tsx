"use client";
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ interviews: 0, candidates: 0, responses: 0 });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await apiGet("/protected") as { user: any };
        setUser(res.user);
        // TODO: Load real stats from API
        setStats({ interviews: 3, candidates: 12, responses: 8 });
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header currentPage="dashboard" />

      <main className="container mx-auto px-6 py-12">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Welcome Section */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
          <CardContent className="p-12 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
            </h1>
            <p className="text-lg text-white/90 mb-8">
              Manage your AI-powered video interviews and analyze candidate responses
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Card className="bg-white/15 backdrop-blur-sm border-white/30">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.interviews}</div>
                  <div className="text-sm text-white/80">Active Interviews</div>
                </CardContent>
              </Card>
              <Card className="bg-white/15 backdrop-blur-sm border-white/30">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">{stats.candidates}</div>
                  <div className="text-sm text-white/80">Total Candidates</div>
                </CardContent>
              </Card>
              <Card className="bg-white/15 backdrop-blur-sm border-white/30">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{stats.responses}</div>
                  <div className="text-sm text-white/80">Pending Reviews</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Create New Interview */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center">
              <div className="text-5xl mb-4">➕</div>
              <h3 className="text-xl font-semibold text-white mb-3">Create Interview</h3>
              <p className="text-white/80 mb-6 leading-relaxed">
                Set up a new video interview with custom questions
              </p>
              <Button asChild variant="brand" className="w-full">
                <Link href="/dashboard/interviews/create">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          {/* My Interviews */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-3">My Interviews</h3>
              <p className="text-white/80 mb-6 leading-relaxed">
                View and manage all your interviews
              </p>
              <Button asChild variant="glass" className="w-full">
                <Link href="/dashboard/interviews">View All</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-3">Analytics</h3>
              <p className="text-white/80 mb-6 leading-relaxed">
                View performance insights and reports
              </p>
              <Button asChild variant="glass" className="w-full">
                <Link href="/dashboard/analytics">View Reports</Link>
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
                No recent activity yet. Create your first interview to get started!
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
