import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { RemoveQuestionCommand } from './remove-question.command';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import type { IQuestionRepository } from '../../../domain/repositories/question.repository.interface';

@CommandHandler(RemoveQuestionCommand)
export class RemoveQuestionHandler
  implements ICommandHandler<RemoveQuestionCommand>
{
  private readonly logger = new Logger(RemoveQuestionHandler.name);

  constructor(
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
    @Inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RemoveQuestionCommand): Promise<void> {
    this.logger.log(
      `Removing question ${command.questionId} from template ${command.templateId}`,
    );

    // Load template aggregate
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new NotFoundException(
        `Template with ID ${command.templateId} not found`,
      );
    }

    // Remove question from aggregate (domain logic with reordering)
    template.removeQuestion(command.questionId);

    // Explicitly delete question from database
    await this.questionRepository.delete(command.questionId);

    // Save aggregate (without the removed question)
    await this.templateRepository.save(template);

    // Publish domain events
    const events = template.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    template.commit();

    this.logger.log(`Question ${command.questionId} removed successfully`);
  }
}
