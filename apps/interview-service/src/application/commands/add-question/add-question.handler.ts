import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AddQuestionCommand } from './add-question.command';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import type { IOutboxService } from '../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../interfaces/unit-of-work.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { TemplateNotFoundException, TemplateUnauthorizedException } from '../../../domain/exceptions/interview-template.exceptions';
import { Question } from '../../../domain/entities/question.entity';
import { QuestionType } from '../../../domain/value-objects/question-type.vo';
import { QuestionOption } from '../../../domain/value-objects/question-option.vo';

@CommandHandler(AddQuestionCommand)
export class AddQuestionHandler
  implements ICommandHandler<AddQuestionCommand>
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

  async execute(command: AddQuestionCommand): Promise<string> {
    this.logger.info('Adding question to template', { action: 'AddQuestion', templateId: command.templateId });

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

    // Atomic write: save aggregate + outbox event in single transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.templateRepository.save(template, tx);
      return this.outboxService.saveEvent(
        'template.question.added',
        {
          templateId: command.templateId,
          questionId,
          questionText: command.text,
          questionType: command.type,
          order: command.order,
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

    this.logger.info('Question added to template', { action: 'AddQuestion', templateId: command.templateId, questionId });

    return questionId;
  }
}
