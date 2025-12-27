'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  Play, 
  FileText, 
  Code, 
  Video,
  Bot,
  User,
  Calendar,
  Building2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getInvitation, listHRInvitations, InvitationWithDetails, InvitationResponse, Question } from '@/lib/api/invitations';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getResponseTypeIcon(type: string) {
  switch (type) {
    case 'video':
      return <Video className="w-4 h-4" />;
    case 'code':
      return <Code className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
}

function getResponseTypeBadge(type: string) {
  const colors = {
    video: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    code: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    text: 'bg-green-500/20 text-green-300 border-green-500/30',
  };
  return colors[type as keyof typeof colors] || colors.text;
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.id as string;

  const [invitation, setInvitation] = useState<InvitationWithDetails | null>(null);
  const [candidateName, setCandidateName] = useState<string | null>(null);
  const [candidateEmail, setCandidateEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvitation();
  }, [invitationId]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load invitation details and candidate info in parallel
      const [invitationData, listResponse] = await Promise.all([
        getInvitation(invitationId, true),
        listHRInvitations({ status: 'completed', limit: 100 })
      ]);
      
      setInvitation(invitationData);
      
      // Find candidate info from list
      const listItem = listResponse.items?.find(item => item.id === invitationId);
      if (listItem) {
        setCandidateName(listItem.candidateName || null);
        setCandidateEmail(listItem.candidateEmail || null);
      }
    } catch (err: any) {
      console.error('Failed to load invitation:', err);
      setError(err.message || 'Failed to load interview details');
      toast.error('Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };

  // Get questions from invitation (handle both formats)
  const getQuestions = (): Question[] => {
    if (!invitation) return [];
    if (invitation.questions) return invitation.questions;
    if (invitation.template?.questions) return invitation.template.questions;
    return [];
  };

  // Find response for a question
  const getResponseForQuestion = (questionId: string): InvitationResponse | undefined => {
    return invitation?.responses?.find(r => r.questionId === questionId);
  };

  // Calculate total duration
  const getTotalDuration = (): number => {
    if (!invitation?.responses) return 0;
    return invitation.responses.reduce((sum, r) => sum + r.duration, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-white/60">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to load interview</h2>
          <p className="text-white/60 mb-4">{error || 'Interview not found'}</p>
          <Button onClick={() => router.back()} variant="outline" className="border-white/20 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const questions = getQuestions();
  const totalDuration = getTotalDuration();
  const templateTitle = invitation.templateTitle || invitation.template?.title || 'Interview';

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Review List
        </Button>

        <Button
          disabled
          className="bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
        >
          <Bot className="w-4 h-4 mr-2" />
          AI Summary
        </Button>
      </div>

      {/* Interview Info Card */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl text-white mb-2">
                Interview Review
              </CardTitle>
              <p className="text-lg text-yellow-400 font-medium">{templateTitle}</p>
            </div>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <User className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <p className="text-xs text-white/50">Candidate</p>
                <p className="text-sm text-white font-medium">
                  {candidateName || invitation.candidate?.fullName || 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Building2 className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <p className="text-xs text-white/50">Company</p>
                <p className="text-sm text-white font-medium">{invitation.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Calendar className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <p className="text-xs text-white/50">Completed</p>
                <p className="text-sm text-white font-medium">
                  {invitation.completedAt ? formatDate(invitation.completedAt) : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Clock className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <p className="text-xs text-white/50">Total Duration</p>
                <p className="text-sm text-white font-medium">{formatDuration(totalDuration)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions & Responses */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          Questions & Responses ({questions.length})
        </h2>

        {questions.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-8 h-8 text-white/40 mx-auto mb-3" />
              <p className="text-white/60">No questions found for this interview</p>
            </CardContent>
          </Card>
        ) : (
          questions.map((question, index) => {
            const response = getResponseForQuestion(question.id);
            
            return (
              <Card 
                key={question.id} 
                className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all print:break-inside-avoid"
              >
                <CardContent className="pt-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
                        <span className="text-yellow-400 font-semibold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-white/50 mb-1">Question {index + 1} of {questions.length}</p>
                        {response && (
                          <Badge className={getResponseTypeBadge(response.responseType)}>
                            {getResponseTypeIcon(response.responseType)}
                            <span className="ml-1 capitalize">{response.responseType}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                    {response && (
                      <div className="flex items-center gap-1 text-white/50">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatDuration(response.duration)}</span>
                      </div>
                    )}
                  </div>

                  {/* Question Text */}
                  <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white font-medium">{question.text}</p>
                    {question.hints && (
                      <p className="text-white/50 text-sm mt-2 italic">Hint: {question.hints}</p>
                    )}
                  </div>

                  {/* Response */}
                  {response ? (
                    <div className="space-y-3">
                      <p className="text-sm text-white/70 font-medium">Candidate Response:</p>
                      
                      {/* Video Response */}
                      {response.responseType === 'video' && response.videoUrl && (
                        <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                          <div className="aspect-video bg-black/50 rounded-lg flex items-center justify-center mb-3">
                            <Button 
                              variant="outline" 
                              className="border-white/30 text-white"
                              onClick={() => window.open(response.videoUrl, '_blank')}
                            >
                              <Play className="w-5 h-5 mr-2" />
                              Play Video
                            </Button>
                          </div>
                          <p className="text-xs text-white/50 text-center">
                            Video duration: {formatDuration(response.duration)}
                          </p>
                        </div>
                      )}

                      {/* Text Response */}
                      {response.responseType === 'text' && response.textAnswer && (
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <p className="text-white whitespace-pre-wrap">{response.textAnswer}</p>
                        </div>
                      )}

                      {/* Code Response */}
                      {response.responseType === 'code' && response.codeAnswer && (
                        <div className="bg-gray-900 rounded-lg p-4 border border-white/10 font-mono text-sm overflow-x-auto">
                          <pre className="text-green-400 whitespace-pre-wrap">{response.codeAnswer}</pre>
                        </div>
                      )}

                      {/* Submitted timestamp */}
                      <p className="text-xs text-white/40">
                        Submitted: {formatDate(response.submittedAt)}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                      <p className="text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        No response submitted for this question
                      </p>
                    </div>
                  )}

                  {/* AI Analysis Placeholder */}
                  <div className="mt-4 p-4 bg-white/5 rounded-lg border border-dashed border-white/20">
                    <div className="flex items-center gap-2 text-white/40">
                      <Bot className="w-4 h-4" />
                      <span className="text-sm">AI Analysis will appear here after processing</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-xs text-gray-500 mt-8 pt-4 border-t">
        Generated by AI Video Interview Platform • {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
