"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [stats] = useState({ totalUsers: 127, activeInterviews: 15, totalCandidates: 89, totalHRs: 12 });

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
            Admin Dashboard 👨‍💼
          </h1>
          <p className="text-lg text-white/80">
            System overview and user management
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.totalUsers}</div>
              <div className="text-sm text-white/80">Total Users</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{stats.activeInterviews}</div>
              <div className="text-sm text-white/80">Active Interviews</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalCandidates}</div>
              <div className="text-sm text-white/80">Total Candidates</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{stats.totalHRs}</div>
              <div className="text-sm text-white/80">HR Users</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Manage Users */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-white mb-3">Manage Users</h3>
              <p className="text-white/80 mb-6 leading-relaxed flex-grow">
                Create, edit, and manage user accounts
              </p>
              <Button asChild variant="brand" className="w-full mt-auto">
                <Link href="/admin/users">Manage Users</Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="text-5xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-white mb-3">System Settings</h3>
              <p className="text-white/80 mb-6 leading-relaxed flex-grow">
                Configure system-wide settings
              </p>
              <Button asChild variant="glass" className="w-full mt-auto">
                <Link href="/admin/settings">Settings</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-3">Analytics</h3>
              <p className="text-white/80 mb-6 leading-relaxed flex-grow">
                View system-wide analytics and reports
              </p>
              <Button asChild variant="glass" className="w-full mt-auto">
                <Link href="/admin/analytics">View Reports</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">System Activity</h2>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔒</div>
              <p className="text-white/80 text-lg">
                Admin activity monitoring coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
