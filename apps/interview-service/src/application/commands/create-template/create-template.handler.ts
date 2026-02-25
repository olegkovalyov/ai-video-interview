import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateTemplateCommand } from './create-template.command';
import { InterviewTemplate } from '../../../domain/aggregates/interview-template.aggregate';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

@CommandHandler(CreateTemplateCommand)
export class CreateTemplateHandler
  implements ICommandHandler<CreateTemplateCommand>
{
  constructor(
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
    private readonly eventBus: EventBus,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    @Inject('IUnitOfWork')
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: CreateTemplateCommand): Promise<string> {
    this.logger.info('Creating template', { action: 'CreateTemplate', title: command.title });

    // Generate UUID for template
    const templateId = uuidv4();

    // Create aggregate using factory method
    const template = InterviewTemplate.create(
      templateId,
      command.title,
      command.description,
      command.createdBy,
      command.settings,
    );

    // Atomic write: save aggregate + outbox event in single transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.templateRepository.save(template, tx);
      return this.outboxService.saveEvent(
        'template.created',
        {
          templateId: template.id,
          title: command.title,
          description: command.description,
          createdBy: command.createdBy,
          status: 'draft',
        },
        template.id,
        tx,
      );
    });

    // Post-commit: publish domain events + schedule BullMQ
    const events = template.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    template.commit();
    await this.outboxService.schedulePublishing([eventId]);

    this.logger.info('Template created successfully', { action: 'CreateTemplate', templateId: template.id });
    return template.id;
  }
}
