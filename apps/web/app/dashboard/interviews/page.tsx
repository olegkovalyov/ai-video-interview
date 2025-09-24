"use client";
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4ade80';
      case 'draft': return '#fbbf24';
      case 'closed': return '#94a3b8';
      default: return '#94a3b8';
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
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Loading interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        padding: '20px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <Link href="/dashboard" style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: 'white', 
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>←</span> 🎥 AI Video Interview
        </Link>
        <Link 
          href="/dashboard/interviews/create"
          style={{ 
            background: '#ffd700', 
            color: '#333', 
            padding: '8px 16px', 
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          + Create Interview
        </Link>
      </header>

      <main style={{ 
        padding: '40px', 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        {error && (
          <div style={{ 
            color: '#ffcdd2', 
            backgroundColor: 'rgba(244, 67, 54, 0.1)', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
            My Interviews
          </h1>
          <p style={{ fontSize: '18px', opacity: '0.8' }}>
            Manage your video interviews and review candidate responses
          </p>
        </div>

        {interviews.length === 0 ? (
          /* Empty State */
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '60px 40px',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '72px', marginBottom: '24px', opacity: '0.6' }}>📋</div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
              No interviews yet
            </h2>
            <p style={{ fontSize: '16px', opacity: '0.8', marginBottom: '32px' }}>
              Create your first interview to start evaluating candidates with AI-powered analysis
            </p>
            <Link 
              href="/dashboard/interviews/create"
              style={{ 
                display: 'inline-block',
                background: '#ffd700', 
                color: '#333', 
                padding: '16px 32px', 
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              Create Your First Interview
            </Link>
          </div>
        ) : (
          /* Interviews List */
          <div style={{ 
            display: 'grid', 
            gap: '20px' 
          }}>
            {interviews.map(interview => (
              <div 
                key={interview.id}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
                        {interview.title}
                      </h3>
                      <span style={{
                        background: getStatusColor(interview.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {getStatusLabel(interview.status)}
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
                      {interview.description}
                    </p>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                      <span>📝 {interview.questionsCount} questions</span>
                      <span>👥 {interview.candidatesCount} candidates</span>
                      <span>📹 {interview.responsesCount} responses</span>
                      <span>📅 {new Date(interview.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '20px' }}>
                    <Link
                      href={`/dashboard/interviews/${interview.id}`}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      View
                    </Link>
                    {interview.publicUrl && (
                      <button
                        onClick={() => copyPublicUrl(interview.publicUrl!)}
                        style={{
                          background: '#4ade80',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Copy Link
                      </button>
                    )}
                  </div>
                </div>
                
                {interview.status === 'active' && interview.responsesCount > 0 && (
                  <div style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    padding: '12px 16px', 
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}>
                    <span style={{ color: '#4ade80', fontWeight: '500' }}>
                      🟢 {interview.responsesCount} new responses to review
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
