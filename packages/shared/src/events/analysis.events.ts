// Analysis Service Events

export interface AnalysisCompletedEvent {
  eventId: string;
  eventType: 'analysis.completed';
  timestamp: string;
  version: number;
  payload: {
    analysisId: string;
    invitationId: string;
    candidateId: string;
    templateId: string;
    templateTitle: string;
    companyName: string;
    status: 'completed' | 'failed';
    overallScore: number | null;
    recommendation: 'hire' | 'consider' | 'reject' | null;
    questionsAnalyzed: number;
    processingTimeMs: number;
    totalTokensUsed: number;
    errorMessage?: string;
  };
}

export interface AnalysisFailedEvent {
  eventId: string;
  eventType: 'analysis.failed';
  timestamp: string;
  version: number;
  payload: {
    analysisId: string;
    invitationId: string;
    candidateId: string;
    errorMessage: string;
    processingTimeMs: number;
  };
}

export type AnalysisEvent = AnalysisCompletedEvent | AnalysisFailedEvent;
