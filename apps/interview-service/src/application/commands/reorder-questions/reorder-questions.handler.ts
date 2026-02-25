import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ReorderQuestionsCommand } from './reorder-questions.command';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { TemplateNotFoundException, TemplateUnauthorizedException } from '../../../domain/exceptions/interview-template.exceptions';

@CommandHandler(ReorderQuestionsCommand)
export class ReorderQuestionsHandler
  implements ICommandHandler<ReorderQuestionsCommand>
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

  async execute(command: ReorderQuestionsCommand): Promise<void> {
    this.logger.info('Reordering questions for template', {
      action: 'ReorderQuestions',
      templateId: command.templateId,
    });

    // Load aggregate
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

    // Domain validation + reorder logic (throws domain exceptions on invalid input)
    template.reorderQuestionsByIds(command.questionIds);

    // Atomic write: reorder questions + outbox event in single transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      // Use specialized batch update method with transaction
      await this.templateRepository.reorderQuestions(
        command.templateId,
        command.questionIds,
        tx,
      );
      return this.outboxService.saveEvent(
        'template.questions.reordered',
        {
          templateId: command.templateId,
          questionIds: command.questionIds,
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

    this.logger.info('Questions reordered for template', {
      action: 'ReorderQuestions',
      templateId: command.templateId,
    });
  }
}
