import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateHRProfileCommand } from './update-hr-profile.command';
import type { IHRProfileRepository } from '../../../domain/repositories/hr-profile.repository.interface';

/**
 * UpdateHRProfile Command Handler
 * Updates HR profile with company and position info
 */
@Injectable()
@CommandHandler(UpdateHRProfileCommand)
export class UpdateHRProfileHandler implements ICommandHandler<UpdateHRProfileCommand> {
  constructor(
    @Inject('IHRProfileRepository')
    private readonly repository: IHRProfileRepository,
  ) {}

  async execute(command: UpdateHRProfileCommand): Promise<void> {
    const { userId, companyName, position } = command;

    // 1. Get profile
    const profile = await this.repository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException(`HR profile for user ${userId} not found`);
    }

    // 2. Update company name if provided
    if (companyName !== undefined) {
      profile.updateCompanyName(companyName);
    }

    // 3. Update position if provided
    if (position !== undefined) {
      profile.updatePosition(position);
    }

    // 4. Save (isProfileComplete is calculated automatically)
    await this.repository.save(profile);
  }
}
