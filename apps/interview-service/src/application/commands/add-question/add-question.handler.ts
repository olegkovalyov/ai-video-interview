import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { AddQuestionCommand } from './add-question.command';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import { Question } from '../../../domain/entities/question.entity';
import { QuestionType } from '../../../domain/value-objects/question-type.vo';

@CommandHandler(AddQuestionCommand)
export class AddQuestionHandler
  implements ICommandHandler<AddQuestionCommand>
{
  private readonly logger = new Logger(AddQuestionHandler.name);

  constructor(
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AddQuestionCommand): Promise<void> {
    this.logger.log(
      `Adding question to template: ${command.templateId}`,
    );

    // Load template aggregate
    const template = await this.templateRepository.findById(command.templateId);
    if (!template) {
      throw new NotFoundException(
        `Template with ID ${command.templateId} not found`,
      );
    }

    // Create Question entity
    const question = Question.create(command.questionId, {
      text: command.text,
      type: QuestionType.create(command.type),
      order: command.order,
      timeLimit: command.timeLimit,
      required: command.required,
      hints: command.hints,
    });

    // Add question to template (domain logic)
    template.addQuestion(question);

    // Save aggregate
    await this.templateRepository.save(template);

    // Publish domain events
    const events = template.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    template.commit();

    this.logger.log(
      `Question ${command.questionId} added to template ${command.templateId}`,
    );
  }
}
