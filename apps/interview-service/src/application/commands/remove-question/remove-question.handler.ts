import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RemoveQuestionCommand } from './remove-question.command';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import type { IQuestionRepository } from '../../../domain/repositories/question.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { TemplateNotFoundException, TemplateUnauthorizedException } from '../../../domain/exceptions/interview-template.exceptions';

@CommandHandler(RemoveQuestionCommand)
export class RemoveQuestionHandler
  implements ICommandHandler<RemoveQuestionCommand>
{
  constructor(
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
    @Inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    private readonly eventBus: EventBus,
    @Inject('IOutboxService')
    private readonly outboxService: IOutboxService,
    @Inject('IUnitOfWork')
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: RemoveQuestionCommand): Promise<void> {
    this.logger.info('Removing question from template', {
      action: 'RemoveQuestion',
      templateId: command.templateId,
      questionId: command.questionId,
    });

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

    // Remove question from aggregate (domain logic with reordering)
    template.removeQuestion(command.questionId);

    // Atomic write: delete question + save aggregate + outbox event in single transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      // Explicitly delete question from database
      await this.questionRepository.delete(command.questionId);
      // Save aggregate (without the removed question)
      await this.templateRepository.save(template, tx);
      return this.outboxService.saveEvent(
        'template.question.removed',
        {
          templateId: command.templateId,
          questionId: command.questionId,
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

    this.logger.info('Question removed successfully', {
      action: 'RemoveQuestion',
      templateId: command.templateId,
      questionId: command.questionId,
    });
  }
}
