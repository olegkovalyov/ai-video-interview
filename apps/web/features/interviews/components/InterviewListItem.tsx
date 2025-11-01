import Link from 'next/link';
import { Copy, Calendar, Users, FileText, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Interview } from '../types/interview.types';
import { getStatusBadgeVariant, copyToClipboard, formatDate } from '../utils/interview-helpers';

interface InterviewListItemProps {
  interview: Interview;
}

export function InterviewListItem({ interview }: InterviewListItemProps) {
  const candidatesCount = interview.candidatesCount ?? interview.candidates ?? 0;
  const responsesCount = interview.responsesCount ?? interview.responses ?? 0;
  const questionsCount = interview.questionsCount ?? 0;

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
      <CardContent className="p-6">
        <div className="flex justify-between items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-white">{interview.title}</h3>
              <Badge variant={getStatusBadgeVariant(interview.status)}>
                {interview.status}
              </Badge>
            </div>
            <p className="text-white/80 mb-3">{interview.description}</p>
            <div className="flex gap-6 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {questionsCount} questions
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {candidatesCount} candidates
              </span>
              <span className="flex items-center gap-1">
                <Video className="w-4 h-4" />
                {responsesCount} responses
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(interview.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button asChild variant="glass" size="sm">
              <Link href={`/dashboard/interviews/${interview.id}`}>View</Link>
            </Button>
            {interview.publicUrl && (
              <Button onClick={() => copyToClipboard(interview.publicUrl!, 'Link copied!')} variant="default" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            )}
          </div>
        </div>

        {interview.status === 'active' && responsesCount > 0 && (
          <div className="mt-4 bg-green-500/20 border border-green-500/30 text-green-200 px-4 py-3 rounded-lg text-sm font-medium">
            🟢 {responsesCount} new responses to review
          </div>
        )}
      </CardContent>
    </Card>
  );
}
