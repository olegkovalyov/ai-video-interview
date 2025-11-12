export class RemoveCandidateSkillCommand {
  constructor(
    public readonly candidateId: string,
    public readonly skillId: string,
  ) {}
}
