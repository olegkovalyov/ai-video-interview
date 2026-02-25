import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateTemplateCommand } from './update-template.command';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { TemplateNotFoundException, TemplateUnauthorizedException } from '../../../domain/exceptions/interview-template.exceptions';

@CommandHandler(UpdateTemplateCommand)
export class UpdateTemplateHandler
  implements ICommandHandler<UpdateTemplateCommand>
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

  async execute(command: UpdateTemplateCommand): Promise<void> {
    this.logger.info('Updating template', { action: 'UpdateTemplate', templateId: command.templateId });

    // Load template aggregate
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new TemplateNotFoundException(command.templateId);
    }

    // Ownership check: HR can only modify their own templates
    if (command.userRole && command.userRole !== 'admin' && command.userId) {
      if (template.createdBy !== command.userId) {
        throw new TemplateUnauthorizedException(command.userId, command.templateId);
      }
    }

    // Update metadata if provided
    if (command.title !== undefined || command.description !== undefined) {
      template.updateMetadata(command.title, command.description);
    }

    // Update settings if provided
    if (command.settings) {
      template.updateSettings(command.settings);
    }

    // Atomic write: save aggregate + outbox event in single transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.templateRepository.save(template, tx);
      return this.outboxService.saveEvent(
        'template.updated',
        {
          templateId: command.templateId,
          updatedAt: new Date().toISOString(),
        },
        command.templateId,
        tx,
      );
    });

    // Post-commit: publish domain events + schedule BullMQ
    const events = template.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    template.commit();
    await this.outboxService.schedulePublishing([eventId]);

    this.logger.info('Template updated successfully', { action: 'UpdateTemplate', templateId: command.templateId });
  }
}
