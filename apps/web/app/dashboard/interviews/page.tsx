"use client";
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Calendar, Users, FileText, Video } from "lucide-react";

interface Interview {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'closed';
  questionsCount: number;
  candidatesCount: number;
  responsesCount: number;
  createdAt: string;
  publicUrl?: string;
}

export default function InterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with real API call
      // const res = await apiGet<{ interviews: Interview[] }>("/interviews");
      // setInterviews(res.interviews);
      
      // Mock data for now
      setTimeout(() => {
        setInterviews([
          {
            id: "1",
            title: "Frontend Developer Interview",
            description: "Technical interview for React.js position",
            status: "active",
            questionsCount: 5,
            candidatesCount: 8,
            responsesCount: 3,
            createdAt: "2025-01-08T10:00:00Z",
            publicUrl: "https://interview.app/i/abc123"
          },
          {
            id: "2", 
            title: "Product Manager Assessment",
            description: "Behavioral and strategic thinking questions",
            status: "draft",
            questionsCount: 7,
            candidatesCount: 0,
            responsesCount: 0,
            createdAt: "2025-01-09T14:30:00Z"
          },
          {
            id: "3",
            title: "Senior Backend Engineer",
            description: "System design and coding challenges",
            status: "closed",
            questionsCount: 6,
            candidatesCount: 12,
            responsesCount: 8,
            createdAt: "2025-01-05T09:15:00Z",
            publicUrl: "https://interview.app/i/def456"
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (e: any) {
      setError(e.message || "Failed to load interviews");
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'secondary';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'draft': return 'Draft';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const copyPublicUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    // TODO: Show toast notification
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-lg">Loading interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header currentPage="interviews" />

      <main className="container mx-auto px-6 py-12">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Page Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              My Interviews
            </h1>
            <p className="text-lg text-white/80">
              Manage your video interviews and review candidate responses
            </p>
          </div>
          <Button asChild variant="brand" size="lg">
            <Link href="/dashboard/interviews/create">
              <Plus className="w-5 h-5 mr-2" />
              Create Interview
            </Link>
          </Button>
        </div>

        {interviews.length === 0 ? (
          /* Empty State */
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-16 text-center">
              <div className="text-7xl mb-6 opacity-60">📋</div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                No interviews yet
              </h2>
              <p className="text-white/80 mb-8 max-w-md mx-auto">
                Create your first interview to start evaluating candidates with AI-powered analysis
              </p>
              <Button asChild variant="brand" size="lg">
                <Link href="/dashboard/interviews/create">
                  Create Your First Interview
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Interviews List */
          <div className="grid gap-6">
            {interviews.map(interview => (
              <Card 
                key={interview.id}
                className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          {interview.title}
                        </h3>
                        <Badge variant={getStatusVariant(interview.status)}>
                          {getStatusLabel(interview.status)}
                        </Badge>
                      </div>
                      <p className="text-white/80 mb-3">
                        {interview.description}
                      </p>
                      <div className="flex gap-6 text-sm text-white/70">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {interview.questionsCount} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {interview.candidatesCount} candidates
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-4 h-4" />
                          {interview.responsesCount} responses
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(interview.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      <Button asChild variant="glass" size="sm">
                        <Link href={`/dashboard/interviews/${interview.id}`}>
                          View
                        </Link>
                      </Button>
                      {interview.publicUrl && (
                        <Button
                          onClick={() => copyPublicUrl(interview.publicUrl!)}
                          variant="default"
                          size="sm"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {interview.status === 'active' && interview.responsesCount > 0 && (
                    <div className="mt-4 bg-green-500/20 border border-green-500/30 text-green-200 px-4 py-3 rounded-lg text-sm font-medium">
                      🟢 {interview.responsesCount} new responses to review
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
