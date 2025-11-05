import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreateTemplateCommand } from './create-template.command';
import { InterviewTemplate } from '../../../domain/aggregates/interview-template.aggregate';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';

@CommandHandler(CreateTemplateCommand)
export class CreateTemplateHandler
  implements ICommandHandler<CreateTemplateCommand>
{
  private readonly logger = new Logger(CreateTemplateHandler.name);

  constructor(
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateTemplateCommand): Promise<string> {
    this.logger.log(`Creating template: ${command.title}`);

    // Create aggregate using factory method
    const template = InterviewTemplate.create(
      command.id,
      command.title,
      command.description,
      command.createdBy,
      command.settings,
    );

    // Save to repository
    await this.templateRepository.save(template);

    // Publish domain events
    const events = template.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    template.commit();

    this.logger.log(`Template created successfully: ${template.id}`);
    return template.id;
  }
}
