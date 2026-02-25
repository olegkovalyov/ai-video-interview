import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteTemplateCommand } from './delete-template.command';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { TemplateNotFoundException, TemplateUnauthorizedException } from '../../../domain/exceptions/interview-template.exceptions';

@CommandHandler(DeleteTemplateCommand)
export class DeleteTemplateHandler
  implements ICommandHandler<DeleteTemplateCommand>
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

  async execute(command: DeleteTemplateCommand): Promise<void> {
    this.logger.info('Archiving template', { action: 'DeleteTemplate', templateId: command.templateId });

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

    // Archive template (soft delete)
    template.archive();

    // Atomic write: save outbox event BEFORE delete inside transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      const id = await this.outboxService.saveEvent(
        'template.deleted',
        {
          templateId: command.templateId,
        },
        command.templateId,
        tx,
      );
      await this.templateRepository.save(template, tx);
      return id;
    });

    // Post-commit: publish domain events + schedule BullMQ
    const events = template.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    template.commit();
    await this.outboxService.schedulePublishing([eventId]);

    this.logger.info('Template archived successfully', { action: 'DeleteTemplate', templateId: command.templateId });
  }
}
