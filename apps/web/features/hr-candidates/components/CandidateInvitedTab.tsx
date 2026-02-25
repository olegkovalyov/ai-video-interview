'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Play, MoreVertical, AlertCircle, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { listHRInvitations, type InvitationListItem, type InvitationStatus } from '@/lib/api/invitations';

type FilterStatus = 'all' | 'pending' | 'in_progress';

function getStatusBadge(status: InvitationStatus) {
  switch (status) {
    case 'pending':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case 'in_progress':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
          <Play className="w-3 h-3" />
          In Progress
        </span>
      );
    case 'expired':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium">
          <AlertCircle className="w-3 h-3" />
          Expired
        </span>
      );
    default:
      return null;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CandidateInvitedTab() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [invitations, setInvitations] = useState<InvitationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load pending and in_progress invitations (not completed)
      const response = await listHRInvitations({ limit: 100 });
      // Filter out completed - they go to another tab
      const activeInvitations = (response.items || []).filter(
        inv => inv.status === 'pending' || inv.status === 'in_progress' || inv.status === 'expired'
      );
      setInvitations(activeInvitations);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load invitations';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const filteredInvitations = invitations.filter(inv => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  const pendingCount = invitations.filter(i => i.status === 'pending').length;
  const inProgressCount = invitations.filter(i => i.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Filter Pills */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-white text-gray-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          All ({invitations.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
            filter === 'pending'
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
            filter === 'in_progress'
              ? 'bg-blue-500 text-white'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        
        {/* Refresh Button */}
        <button
          onClick={loadInvitations}
          disabled={isLoading}
          className="ml-auto px-3 py-2 rounded-full text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-white/50 mx-auto mb-4 animate-spin" />
            <p className="text-white/70">Loading invitations...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Failed to load</h3>
            <p className="text-white/70 mb-4">{error}</p>
            <Button onClick={loadInvitations} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : filteredInvitations.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No invitations found</h3>
            <p className="text-white/70">Invite candidates from the Search tab</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvitations.map(invitation => (
            <Card key={invitation.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {(invitation.candidateName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white">{invitation.candidateName || 'Unknown'}</h3>
                        {getStatusBadge(invitation.status)}
                      </div>
                      <p className="text-white/60 text-sm mb-3">{invitation.candidateEmail || invitation.candidateId}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-white/70">
                          <span className="text-white/50">Template:</span>
                          <span className="text-white">{invitation.templateTitle}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/70">
                          <span className="text-white/50">Company:</span>
                          <span className="text-white">{invitation.companyName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/70">
                          <Calendar className="w-3.5 h-3.5 text-white/50" />
                          <span className="text-white/50">Expires:</span>
                          <span className="text-white">{formatDate(invitation.expiresAt)}</span>
                        </div>
                      </div>

                      {/* Progress bar for in_progress */}
                      {invitation.status === 'in_progress' && invitation.progress && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                            <span>Progress</span>
                            <span>{invitation.progress.answered}/{invitation.progress.total} questions</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${invitation.progress.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="flex gap-4 mt-3 text-xs text-white/50">
                        <span>Invited: {formatDate(invitation.createdAt)}</span>
                        {invitation.startedAt && (
                          <span>Started: {formatDate(invitation.startedAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                      onClick={() => toast.info('More options - coming soon')}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
