import { IQuery } from '@nestjs/cqrs';

export class GetTemplateQuestionsQuery implements IQuery {
  constructor(public readonly templateId: string) {}
}
