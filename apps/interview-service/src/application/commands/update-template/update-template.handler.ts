import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { UpdateTemplateCommand } from './update-template.command';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';

@CommandHandler(UpdateTemplateCommand)
export class UpdateTemplateHandler
  implements ICommandHandler<UpdateTemplateCommand>
{
  private readonly logger = new Logger(UpdateTemplateHandler.name);

  constructor(
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateTemplateCommand): Promise<void> {
    this.logger.log(`Updating template: ${command.templateId}`);

    // Load template aggregate
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new NotFoundException(
        `Template with ID ${command.templateId} not found`,
      );
    }

    // Update metadata if provided
    if (command.title !== undefined || command.description !== undefined) {
      template.updateMetadata(command.title, command.description);
    }

    // Update settings if provided
    if (command.settings) {
      template.updateSettings(command.settings);
    }

    // Save aggregate
    await this.templateRepository.save(template);

    // Publish domain events (if any)
    const events = template.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    template.commit();

    this.logger.log(`Template ${command.templateId} updated successfully`);
  }
}
