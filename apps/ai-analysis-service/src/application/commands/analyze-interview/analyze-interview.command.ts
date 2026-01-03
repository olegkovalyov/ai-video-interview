import { InvitationCompletedEventData } from '../../dto/kafka/invitation-completed.event';

export class AnalyzeInterviewCommand {
  constructor(public readonly eventData: InvitationCompletedEventData) {}
}
