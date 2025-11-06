import { IQuery } from '@nestjs/cqrs';

export class ListTemplatesQuery implements IQuery {
  constructor(
    public readonly userId?: string,
    public readonly userRole?: string,
    public readonly status?: string, // 'draft' | 'active' | 'archived'
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}
