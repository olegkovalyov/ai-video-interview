import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReorderQuestionsCommand } from './reorder-questions.command';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';

@CommandHandler(ReorderQuestionsCommand)
export class ReorderQuestionsHandler
  implements ICommandHandler<ReorderQuestionsCommand>
{
  private readonly logger = new Logger(ReorderQuestionsHandler.name);

  constructor(
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReorderQuestionsCommand): Promise<void> {
    this.logger.log(
      `Reordering questions for template: ${command.templateId}`,
    );

    // Load aggregate
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new NotFoundException(
        `Template with ID ${command.templateId} not found`,
      );
    }

    // Domain validation + reorder logic
    try {
      template.reorderQuestionsByIds(command.questionIds);
    } catch (error) {
      // Convert domain errors to HTTP 400 Bad Request
      throw new BadRequestException(error.message);
    }

    // ВАЖНО: используем специальный метод для batch update
    await this.templateRepository.reorderQuestions(
      command.templateId,
      command.questionIds,
    );

    // Publish domain events
    const events = template.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    template.commit();

    this.logger.log(
      `Questions reordered for template ${command.templateId}`,
    );
  }
}
