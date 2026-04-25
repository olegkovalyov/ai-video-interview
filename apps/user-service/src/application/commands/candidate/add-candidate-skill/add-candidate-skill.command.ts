import { Command } from '@nestjs/cqrs';

export interface AddCandidateSkillCommandProps {
  candidateId: string;
  skillId: string;
  description: string | null;
  proficiencyLevel: string | null;
  yearsOfExperience: number | null;
}

export class AddCandidateSkillCommand extends Command<{
  candidateSkillId: string;
}> {
  public readonly candidateId: string;
  public readonly skillId: string;
  public readonly description: string | null;
  public readonly proficiencyLevel: string | null;
  public readonly yearsOfExperience: number | null;

  constructor(props: AddCandidateSkillCommandProps) {
    super();
    this.candidateId = props.candidateId;
    this.skillId = props.skillId;
    this.description = props.description;
    this.proficiencyLevel = props.proficiencyLevel;
    this.yearsOfExperience = props.yearsOfExperience;
  }
}
