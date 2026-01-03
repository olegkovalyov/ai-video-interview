export interface QuestionOptionData {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionData {
  id: string;
  text: string;
  type: string;
  orderIndex: number;
  options?: QuestionOptionData[];
}

export interface ResponseData {
  id: string;
  questionId: string;
  textAnswer?: string;
  selectedOptionId?: string;
  videoUrl?: string;
  submittedAt: Date;
}

export interface InvitationCompletedEventData {
  invitationId: string;
  candidateId: string;
  templateId: string;
  templateTitle: string;
  companyName: string;
  completedAt: Date;
  questions: QuestionData[];
  responses: ResponseData[];
  language?: string;
}
