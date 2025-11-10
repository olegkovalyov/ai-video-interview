import { InterviewTemplate } from '../../../domain/aggregates/interview-template.aggregate';
import { Question } from '../../../domain/entities/question.entity';
import { QuestionType } from '../../../domain/value-objects/question-type.vo';
import { QuestionOption } from '../../../domain/value-objects/question-option.vo';
import { TemplateStatus } from '../../../domain/value-objects/template-status.vo';
import { InterviewSettings } from '../../../domain/value-objects/interview-settings.vo';
import { InterviewTemplateEntity } from '../entities/interview-template.entity';
import { QuestionEntity } from '../entities/question.entity';

export class InterviewTemplateMapper {
  /**
   * Map TypeORM entity to Domain aggregate
   */
  static toDomain(entity: InterviewTemplateEntity): InterviewTemplate {
    // Map questions
    const questions = entity.questions
      ? entity.questions.map((q) => this.questionEntityToDomain(q))
      : [];

    // Create status value object
    const status = TemplateStatus.create(entity.status);

    // Create settings value object
    const settings = InterviewSettings.create(entity.settings);

    // Reconstruct aggregate
    const template = InterviewTemplate.reconstitute({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      createdBy: entity.createdBy,
      status,
      settings,
      questions,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });

    return template;
  }

  /**
   * Map Domain aggregate to TypeORM entity
   */
  static toEntity(aggregate: InterviewTemplate): InterviewTemplateEntity {
    const entity = new InterviewTemplateEntity();

    entity.id = aggregate.id;
    entity.title = aggregate.title;
    entity.description = aggregate.description;
    entity.createdBy = aggregate.createdBy;
    entity.status = aggregate.status.toString();
    entity.settings = {
      totalTimeLimit: aggregate.settings.totalTimeLimit,
      allowRetakes: aggregate.settings.allowRetakes,
      showTimer: aggregate.settings.showTimer,
      randomizeQuestions: aggregate.settings.randomizeQuestions,
    };
    entity.createdAt = aggregate.createdAt;
    entity.updatedAt = aggregate.updatedAt;

    // Map questions
    const questions = aggregate.getSortedQuestions();
    entity.questions = questions.map((q) =>
      this.questionDomainToEntity(q, aggregate.id),
    );

    return entity;
  }

  /**
   * Map QuestionEntity to Domain Question
   */
  private static questionEntityToDomain(entity: QuestionEntity): Question {
    const type = QuestionType.create(entity.type);

    // Map options if present (for multiple_choice questions)
    const options = entity.options?.map((opt) =>
      QuestionOption.create({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
      }),
    );

    return Question.reconstitute(entity.id, {
      text: entity.text,
      type,
      order: entity.order,
      timeLimit: entity.timeLimit,
      required: entity.required,
      hints: entity.hints || undefined,
      options,
      createdAt: entity.createdAt,
    });
  }

  /**
   * Map Domain Question to QuestionEntity
   */
  private static questionDomainToEntity(
    question: Question,
    templateId: string,
  ): QuestionEntity {
    const entity = new QuestionEntity();

    entity.id = question.id;
    entity.templateId = templateId;
    entity.text = question.text;
    entity.type = question.type.toString();
    entity.order = question.order;
    entity.timeLimit = question.timeLimit;
    entity.required = question.required;
    entity.hints = question.hints || null;
    entity.createdAt = question.createdAt;

    // Map options to JSONB (for multiple_choice questions)
    entity.options = question.options?.map((opt) => ({
      id: opt.id,
      text: opt.text,
      isCorrect: opt.isCorrect,
    })) || null;

    return entity;
  }
}
