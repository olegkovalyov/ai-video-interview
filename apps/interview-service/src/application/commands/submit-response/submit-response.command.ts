import { ICommand } from '@nestjs/cqrs';

export class SubmitResponseCommand implements ICommand {
  constructor(
    public readonly invitationId: string,
    public readonly userId: string,
    public readonly questionId: string,
    public readonly questionIndex: number,
    public readonly questionText: string,
    public readonly responseType: 'text' | 'code' | 'video',
    public readonly duration: number,
    public readonly textAnswer?: string,
    public readonly codeAnswer?: string,
    public readonly videoUrl?: string,
  ) {}
}
