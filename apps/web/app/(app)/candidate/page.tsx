"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CandidateDashboardPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [stats] = useState({ invitations: 2, completed: 5, pending: 1 });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        await apiGet("/protected");
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (errorMessage.includes('401')) {
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

      <main className="container mx-auto px-6 py-12">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

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
      </main>
    </div>
  );
}
