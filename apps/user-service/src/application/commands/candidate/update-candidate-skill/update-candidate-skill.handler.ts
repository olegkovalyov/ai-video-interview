import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { UpdateCandidateSkillCommand } from './update-candidate-skill.command';
import { CandidateSkillUpdateService } from '../../../services/candidate-skill-update.service';

/**
 * Thin CQRS adapter over {@link CandidateSkillUpdateService}.
 */
@Injectable()
@CommandHandler(UpdateCandidateSkillCommand)
export class UpdateCandidateSkillHandler
  implements ICommandHandler<UpdateCandidateSkillCommand>
{
  constructor(
    private readonly updateCandidateSkill: CandidateSkillUpdateService,
  ) {}

  execute(command: UpdateCandidateSkillCommand): Promise<void> {
    return this.updateCandidateSkill.update({
      candidateId: command.candidateId,
      skillId: command.skillId,
      description: command.description,
      proficiencyLevel: command.proficiencyLevel,
      yearsOfExperience: command.yearsOfExperience,
    });
  }
}
