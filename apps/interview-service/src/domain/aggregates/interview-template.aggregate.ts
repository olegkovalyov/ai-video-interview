import { AggregateRoot } from '../base/base.aggregate-root';
import { Question } from '../entities/question.entity';
import { InterviewSettings } from '../value-objects/interview-settings.vo';
import { TemplateStatus } from '../value-objects/template-status.vo';
import { QuestionType } from '../value-objects/question-type.vo';
import {
  TemplateCreatedEvent,
  QuestionAddedEvent,
  QuestionRemovedEvent,
  QuestionsReorderedEvent,
  TemplatePublishedEvent,
  TemplateArchivedEvent,
} from '../events';
import {
  InvalidTemplateMetadataException,
  TemplateArchivedException,
  DuplicateQuestionOrderException,
  QuestionNotFoundException,
  InvalidTemplateStateException,
  TemplateCannotBePublishedException,
  InvalidQuestionException,
} from '../exceptions/interview-template.exceptions';

export interface InterviewTemplateProps {
  id: string;
  title: string;
  description: string;
  createdBy: string; // HR userId
  status: TemplateStatus;
  questions: Question[];
  settings: InterviewSettings;
  createdAt: Date;
  updatedAt: Date;
}

export class InterviewTemplate extends AggregateRoot {
  private readonly props: InterviewTemplateProps;

  private constructor(props: InterviewTemplateProps) {
    super();
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get status(): TemplateStatus {
    return this.props.status;
  }

  get questions(): Question[] {
    return [...this.props.questions]; // Return copy to prevent external modification
  }

  get settings(): InterviewSettings {
    return this.props.settings;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Factory method - Create new template
  static create(
    id: string,
    title: string,
    description: string,
    createdBy: string,
    settings?: InterviewSettings,
  ): InterviewTemplate {
    // Domain validation
    if (!title || title.trim().length === 0) {
      throw new InvalidTemplateMetadataException('title', 'cannot be empty');
    }

    if (!description || description.trim().length === 0) {
      throw new InvalidTemplateMetadataException('description', 'cannot be empty');
    }

    const template = new InterviewTemplate({
      id,
      title: title.trim(),
      description: description.trim(),
      createdBy,
      status: TemplateStatus.draft(),
      questions: [],
      settings: settings || InterviewSettings.default(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Raise domain event
    template.apply(
      new TemplateCreatedEvent(id, title.trim(), description.trim(), createdBy),
    );

    return template;
  }

  // Factory method - Reconstitute from persistence
  static reconstitute(props: InterviewTemplateProps): InterviewTemplate {
    return new InterviewTemplate(props);
  }

  // Business Methods

  /**
   * Add a question to the template
   * Business Rule: Cannot add questions to archived template
   */
  addQuestion(question: Question): void {
    if (this.status.isArchived()) {
      throw new TemplateArchivedException(this.id);
    }

    // Check for duplicate order
    const existingQuestion = this.props.questions.find(
      (q) => q.order === question.order,
    );
    if (existingQuestion) {
      throw new DuplicateQuestionOrderException(question.order);
    }

    this.props.questions.push(question);
    this.props.updatedAt = new Date();

    // Raise domain event
    this.apply(
      new QuestionAddedEvent(
        this.id,
        question.id,
        question.text,
        question.type.toString(),
        question.order,
      ),
    );
  }

  /**
   * Remove a question from the template
   * Business Rule: Cannot modify archived template
   */
  removeQuestion(questionId: string): void {
    if (this.status.isArchived()) {
      throw new TemplateArchivedException(this.id);
    }

    const questionIndex = this.props.questions.findIndex(
      (q) => q.id === questionId,
    );

    if (questionIndex === -1) {
      throw new QuestionNotFoundException(questionId);
    }

    this.props.questions.splice(questionIndex, 1);
    this.props.updatedAt = new Date();

    // Reorder remaining questions
    this.reorderQuestions();

    // Raise domain event
    this.apply(new QuestionRemovedEvent(this.id, questionId));
  }

  /**
   * Publish the template (make it active)
   * Business Rule: Can only publish draft templates
   * Business Rule: Must have at least one question
   */
  publish(): void {
    if (!this.status.canBePublished()) {
      throw new InvalidTemplateStateException('publish', this.status.toString());
    }

    if (this.props.questions.length === 0) {
      throw new TemplateCannotBePublishedException('no questions');
    }

    this.props.status = TemplateStatus.active();
    this.props.updatedAt = new Date();

    // Raise domain event
    this.apply(
      new TemplatePublishedEvent(
        this.id,
        this.title,
        this.props.questions.length,
      ),
    );
  }

  /**
   * Archive the template
   * Business Rule: Can archive any template (draft or active)
   */
  archive(): void {
    if (this.status.isArchived()) {
      throw new InvalidTemplateStateException('archive', 'archived');
    }

    this.props.status = TemplateStatus.archived();
    this.props.updatedAt = new Date();

    // Raise domain event
    this.apply(new TemplateArchivedEvent(this.id, this.title));
  }

  /**
   * Update template metadata
   * Business Rule: Cannot modify archived template
   */
  updateMetadata(title?: string, description?: string): void {
    if (this.status.isArchived()) {
      throw new TemplateArchivedException(this.id);
    }

    if (title !== undefined) {
      if (title.trim().length === 0) {
        throw new InvalidTemplateMetadataException('title', 'cannot be empty');
      }
      if (title.length > 200) {
        throw new InvalidTemplateMetadataException('title', 'cannot exceed 200 characters');
      }
      this.props.title = title.trim();
    }

    if (description !== undefined) {
      if (description.trim().length === 0) {
        throw new InvalidTemplateMetadataException('description', 'cannot be empty');
      }
      if (description.length > 1000) {
        throw new InvalidTemplateMetadataException('description', 'cannot exceed 1000 characters');
      }
      this.props.description = description.trim();
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Update interview settings
   * Business Rule: Cannot modify archived template
   */
  updateSettings(settings: InterviewSettings): void {
    if (this.status.isArchived()) {
      throw new TemplateArchivedException(this.id);
    }

    this.props.settings = settings;
    this.props.updatedAt = new Date();
  }

  /**
   * Reorder questions by providing IDs in desired order
   * Business Rule: Cannot modify archived template
   * Business Rule: Must provide all question IDs
   * Business Rule: All IDs must exist
   */
  reorderQuestionsByIds(questionIds: string[]): void {
    if (this.status.isArchived()) {
      throw new TemplateArchivedException(this.id);
    }

    // Validate that all question IDs exist
    const existingIds = this.props.questions.map((q) => q.id);
    const allIdsValid = questionIds.every((id) => existingIds.includes(id));

    if (!allIdsValid) {
      throw new QuestionNotFoundException('one or more question IDs');
    }

    // Validate that all questions are provided
    if (questionIds.length !== this.props.questions.length) {
      throw new InvalidQuestionException('must provide all question IDs');
    }

    // Check for duplicates
    const uniqueIds = new Set(questionIds);
    if (uniqueIds.size !== questionIds.length) {
      throw new InvalidQuestionException('duplicate question IDs');
    }

    // Reorder questions based on provided IDs
    questionIds.forEach((id, index) => {
      const question = this.props.questions.find((q) => q.id === id);
      const updatedQuestion = question!.updateOrder(index + 1);

      // Replace in array (immutability)
      const idx = this.props.questions.findIndex((q) => q.id === id);
      this.props.questions[idx] = updatedQuestion;
    });

    this.props.updatedAt = new Date();

    // Raise domain event
    this.apply(new QuestionsReorderedEvent(this.id, questionIds));
  }

  /**
   * Get question by ID
   */
  getQuestion(questionId: string): Question | undefined {
    return this.props.questions.find((q) => q.id === questionId);
  }

  /**
   * Get questions count
   */
  getQuestionsCount(): number {
    return this.props.questions.length;
  }

  /**
   * Check if template has questions
   */
  hasQuestions(): boolean {
    return this.props.questions.length > 0;
  }

  /**
   * Get questions sorted by order
   */
  getSortedQuestions(): Question[] {
    return [...this.props.questions].sort((a, b) => a.order - b.order);
  }

  /**
   * Check if user is owner
   */
  isOwnedBy(userId: string): boolean {
    return this.createdBy === userId;
  }

  // Private helper methods

  /**
   * Reorder questions after deletion
   */
  private reorderQuestions(): void {
    this.props.questions = this.props.questions
      .sort((a, b) => a.order - b.order)
      .map((question, index) => question.updateOrder(index + 1));
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      createdBy: this.createdBy,
      status: this.status.toString(),
      questions: this.questions.map((q) => q.toJSON()),
      settings: this.settings.toJSON(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
