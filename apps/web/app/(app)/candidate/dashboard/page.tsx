'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listCandidateInvitations, startInvitation, InvitationListItem } from '@/lib/api/invitations';
import { Loader2, RefreshCw, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function CandidateDashboardPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<InvitationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listCandidateInvitations({ limit: 100 });
      setInvitations(response.items || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load invitations';
      setError(message);
      console.error('Failed to load invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const handleStartInterview = async (id: string) => {
    try {
      setStartingId(id);
      await startInvitation(id);
      toast.success('Interview started!');
      router.push(`/interview/${id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start interview';
      toast.error(message);
    } finally {
      setStartingId(null);
    }
  };

  // Calculate stats
  const pendingCount = invitations.filter(i => i.status === 'pending').length;
  const inProgressCount = invitations.filter(i => i.status === 'in_progress').length;
  const completedCount = invitations.filter(i => i.status === 'completed').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm flex items-center gap-1">
            <Play className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'expired':
        return (
          <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              My Dashboard
            </h1>
            <p className="text-lg text-white/80">
              Track your interview invitations and progress
            </p>
          </div>
          <button
            onClick={loadInvitations}
            disabled={loading}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">Pending Interviews</h3>
            <p className="text-4xl font-bold text-white">{loading ? '-' : pendingCount}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">In Progress</h3>
            <p className="text-4xl font-bold text-white">{loading ? '-' : inProgressCount}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">Completed</h3>
            <p className="text-4xl font-bold text-white">{loading ? '-' : completedCount}</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Your Interviews</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white/80 mb-4">{error}</p>
              <button
                onClick={loadInvitations}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">No interview invitations yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div 
                  key={invitation.id} 
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white font-semibold">{invitation.templateTitle}</h3>
                      <p className="text-white/60 text-sm">{invitation.companyName}</p>
                    </div>
                    {getStatusBadge(invitation.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-white/70 text-sm mb-3">
                    <span>Invited {formatDate(invitation.createdAt)}</span>
                    {invitation.progress && (
                      <span>• Progress: {invitation.progress.answered}/{invitation.progress.total}</span>
                    )}
                    {invitation.status === 'pending' && !isExpired(invitation.expiresAt) && (
                      <span>• Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  {invitation.status === 'pending' && !isExpired(invitation.expiresAt) && (
                    <button
                      onClick={() => handleStartInterview(invitation.id)}
                      disabled={startingId === invitation.id}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {startingId === invitation.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Start Interview
                        </>
                      )}
                    </button>
                  )}
                  
                  {invitation.status === 'in_progress' && (
                    <button
                      onClick={() => router.push(`/interview/${invitation.id}`)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      Resume Interview
                    </button>
                  )}
                  
                  {invitation.status === 'completed' && (
                    <button
                      onClick={() => {
                        // TODO: Navigate to results page
                        toast.info('Results page coming soon');
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors cursor-pointer"
                    >
                      View Results
                    </button>
                  )}
                  
                  {invitation.status === 'pending' && isExpired(invitation.expiresAt) && (
                    <span className="text-red-400 text-sm">This invitation has expired</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
