import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { PublishTemplateCommand } from './publish-template.command';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';

@CommandHandler(PublishTemplateCommand)
export class PublishTemplateHandler
  implements ICommandHandler<PublishTemplateCommand>
{
  private readonly logger = new Logger(PublishTemplateHandler.name);

  constructor(
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: PublishTemplateCommand): Promise<void> {
    this.logger.log(`Publishing template: ${command.templateId}`);

    // Load template aggregate
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new NotFoundException(
        `Template with ID ${command.templateId} not found`,
      );
    }

    // Publish template (domain logic with validation)
    template.publish();

    // Save aggregate
    await this.templateRepository.save(template);

    // Publish domain events
    const events = template.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    template.commit();

    this.logger.log(`Template ${command.templateId} published successfully`);
  }
}
