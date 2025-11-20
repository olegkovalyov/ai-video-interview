export class UpdateCandidateExperienceLevelCommand {
  constructor(
    public readonly candidateId: string,
    public readonly experienceLevel: string, // junior | mid | senior | lead
  ) {}
}
