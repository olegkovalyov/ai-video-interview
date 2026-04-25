import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { AddCandidateSkillCommand } from './add-candidate-skill.command';
import { CandidateSkillAdditionService } from '../../../services/candidate-skill-addition.service';

/**
 * Thin CQRS adapter over {@link CandidateSkillAdditionService}.
 */
@Injectable()
@CommandHandler(AddCandidateSkillCommand)
export class AddCandidateSkillHandler
  implements ICommandHandler<AddCandidateSkillCommand>
{
  constructor(
    private readonly addCandidateSkill: CandidateSkillAdditionService,
  ) {}

  execute(
    command: AddCandidateSkillCommand,
  ): Promise<{ candidateSkillId: string }> {
    return this.addCandidateSkill.add({
      candidateId: command.candidateId,
      skillId: command.skillId,
      description: command.description,
      proficiencyLevel: command.proficiencyLevel,
      yearsOfExperience: command.yearsOfExperience,
    });
  }
}
