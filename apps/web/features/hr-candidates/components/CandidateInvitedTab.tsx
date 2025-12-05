'use client';

import { useState } from 'react';
import { Clock, Play, Mail, MoreVertical, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Mock data - will be replaced with real API
const mockInvitations = [
  {
    id: '1',
    candidate: {
      id: 'c1',
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
    template: {
      id: 't1',
      title: 'Frontend Developer Interview',
      questionsCount: 5,
    },
    company: {
      id: 'comp1',
      name: 'TechCorp Inc.',
    },
    status: 'pending' as const,
    createdAt: '2024-12-02T10:00:00Z',
  },
  {
    id: '2',
    candidate: {
      id: 'c2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
    },
    template: {
      id: 't2',
      title: 'Backend Engineer Interview',
      questionsCount: 8,
    },
    company: {
      id: 'comp1',
      name: 'TechCorp Inc.',
    },
    status: 'in_progress' as const,
    startedAt: '2024-12-03T14:30:00Z',
    progress: {
      answered: 3,
      total: 8,
    },
    createdAt: '2024-12-01T09:00:00Z',
  },
  {
    id: '3',
    candidate: {
      id: 'c3',
      name: 'Mike Johnson',
      email: 'mike.j@example.com',
    },
    template: {
      id: 't1',
      title: 'Frontend Developer Interview',
      questionsCount: 5,
    },
    company: {
      id: 'comp2',
      name: 'StartupXYZ',
    },
    status: 'pending' as const,
    createdAt: '2024-12-03T16:00:00Z',
  },
  {
    id: '4',
    candidate: {
      id: 'c4',
      name: 'Sarah Williams',
      email: 'sarah.w@example.com',
    },
    template: {
      id: 't3',
      title: 'Full Stack Developer Interview',
      questionsCount: 10,
    },
    company: {
      id: 'comp1',
      name: 'TechCorp Inc.',
    },
    status: 'in_progress' as const,
    startedAt: '2024-12-04T09:00:00Z',
    progress: {
      answered: 7,
      total: 10,
    },
    createdAt: '2024-12-02T11:00:00Z',
  },
  {
    id: '5',
    candidate: {
      id: 'c5',
      name: 'Alex Brown',
      email: 'alex.b@example.com',
    },
    template: {
      id: 't2',
      title: 'Backend Engineer Interview',
      questionsCount: 8,
    },
    company: {
      id: 'comp2',
      name: 'StartupXYZ',
    },
    status: 'pending' as const,
    createdAt: '2024-12-04T08:00:00Z',
  },
];

type InvitationStatus = 'pending' | 'in_progress';

function getStatusBadge(status: InvitationStatus) {
  if (status === 'pending') {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
      <Play className="w-3 h-3" />
      In Progress
    </span>
  );
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
  const [filter, setFilter] = useState<'all' | InvitationStatus>('all');

  const filteredInvitations = mockInvitations.filter(inv => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  const pendingCount = mockInvitations.filter(i => i.status === 'pending').length;
  const inProgressCount = mockInvitations.filter(i => i.status === 'in_progress').length;

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
          All ({mockInvitations.length})
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
      </div>

      {/* Invitations List */}
      {filteredInvitations.length === 0 ? (
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
                      {invitation.candidate.name.split(' ').map(n => n[0]).join('')}
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white">{invitation.candidate.name}</h3>
                        {getStatusBadge(invitation.status)}
                      </div>
                      <p className="text-white/60 text-sm mb-3">{invitation.candidate.email}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-white/70">
                          <span className="text-white/50">Template:</span>
                          <span className="text-white">{invitation.template.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/70">
                          <span className="text-white/50">Company:</span>
                          <span className="text-white">{invitation.company.name}</span>
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
                              style={{ width: `${(invitation.progress.answered / invitation.progress.total) * 100}%` }}
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
                    {invitation.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 cursor-pointer"
                        onClick={() => toast.info('Resend invitation - coming soon')}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Resend
                      </Button>
                    )}
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
