export class SearchCandidatesBySkillsQuery {
  constructor(
    public readonly skillIds: string[],
    public readonly minProficiency?: string,
    public readonly minYears?: number,
    public readonly experienceLevel?: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
