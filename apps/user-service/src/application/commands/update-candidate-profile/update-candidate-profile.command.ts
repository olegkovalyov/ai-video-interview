/**
 * UpdateCandidateProfile Command
 * Updates candidate's profile information
 */
export class UpdateCandidateProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly skills?: string[],
    public readonly experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead',
  ) {}
}
