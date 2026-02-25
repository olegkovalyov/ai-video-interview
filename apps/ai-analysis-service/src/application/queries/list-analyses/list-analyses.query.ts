import { AnalysisStatusEnum } from '../../../domain/value-objects/analysis-status.vo';

export class ListAnalysesQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly status?: AnalysisStatusEnum,
    public readonly candidateId?: string,
    public readonly templateId?: string,
  ) {}
}
