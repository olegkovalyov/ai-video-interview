import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { DeleteTemplateCommand } from './delete-template.command';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';

@CommandHandler(DeleteTemplateCommand)
export class DeleteTemplateHandler
  implements ICommandHandler<DeleteTemplateCommand>
{
  private readonly logger = new Logger(DeleteTemplateHandler.name);

  constructor(
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteTemplateCommand): Promise<void> {
    this.logger.log(`Archiving template: ${command.templateId}`);

    // Load template aggregate
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new NotFoundException(
        `Template with ID ${command.templateId} not found`,
      );
    }

    // Archive template (soft delete)
    template.archive();

    // Save aggregate
    await this.templateRepository.save(template);

    // Publish domain events
    const events = template.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    template.commit();

    this.logger.log(`Template ${command.templateId} archived successfully`);
  }
}
