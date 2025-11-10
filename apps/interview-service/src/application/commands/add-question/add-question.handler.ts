import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { AddQuestionCommand } from './add-question.command';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import { Question } from '../../../domain/entities/question.entity';
import { QuestionType } from '../../../domain/value-objects/question-type.vo';
import { QuestionOption } from '../../../domain/value-objects/question-option.vo';

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

  async execute(command: AddQuestionCommand): Promise<string> {
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

    // Generate UUID for question
    const questionId = uuidv4();

    // Create Question entity
    const questionType = QuestionType.create(command.type);
    
    // Map options if present (for multiple_choice questions)
    const questionOptions = command.options?.map((opt) =>
      QuestionOption.create({
        id: uuidv4(), // Generate unique ID for each option
        text: opt.text,
        isCorrect: opt.isCorrect,
      }),
    );

    const question = Question.create(questionId, {
      text: command.text,
      type: questionType,
      order: command.order,
      timeLimit: command.timeLimit,
      required: command.required,
      hints: command.hints,
      options: questionOptions,
    });

    // Add question to template (domain logic)
    template.addQuestion(question);

    // Save aggregate (with optimistic lock protection)
    try {
      await this.templateRepository.save(template);
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        this.logger.warn(
          `Optimistic lock conflict for template ${command.templateId}`,
        );
        throw new ConflictException(
          'Template was modified by another user. Please refresh and try again.',
        );
      }
      throw error;
    }

    // Publish domain events
    const events = template.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    template.commit();

    this.logger.log(
      `Question ${questionId} added to template ${command.templateId}`,
    );
    
    return questionId;
  }
}
