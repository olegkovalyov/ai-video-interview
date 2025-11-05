import { IQuery } from '@nestjs/cqrs';

export class GetTemplateQuery implements IQuery {
  constructor(
    public readonly templateId: string,
    public readonly userId?: string,
    public readonly userRole?: string,
  ) {}
}
