import { Question } from '../question.entity';
import { QuestionType } from '../../value-objects/question-type.vo';
import { QuestionOption } from '../../value-objects/question-option.vo';

describe('Question Entity', () => {
  const validQuestionProps = {
    text: 'What is your experience with TypeScript?',
    type: QuestionType.text(),
    order: 1,
    timeLimit: 300,
    required: true,
    hints: 'Mention specific projects',
  };

  describe('Creation', () => {
    it('should create question with valid data', () => {
      const question = Question.create('question-id-1', validQuestionProps);

      expect(question.id).toBe('question-id-1');
      expect(question.text).toBe(validQuestionProps.text);
      expect(question.type.equals(validQuestionProps.type)).toBe(true);
      expect(question.order).toBe(1);
      expect(question.timeLimit).toBe(300);
      expect(question.required).toBe(true);
      expect(question.hints).toBe('Mention specific projects');
      expect(question.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique ID', () => {
      const question1 = Question.create('id-1', validQuestionProps);
      const question2 = Question.create('id-2', validQuestionProps);

      expect(question1.id).not.toBe(question2.id);
    });

    it('should throw error for empty text', () => {
      expect(() =>
        Question.create('id', { ...validQuestionProps, text: '' }),
      ).toThrow('Question text cannot be empty');
    });

    it('should throw error for whitespace-only text', () => {
      expect(() =>
        Question.create('id', { ...validQuestionProps, text: '   ' }),
      ).toThrow('Question text cannot be empty');
    });

    it('should throw error for text < 10 characters', () => {
      expect(() =>
        Question.create('id', { ...validQuestionProps, text: 'Short' }),
      ).toThrow('Question text must be at least 10 characters');
    });

    it('should throw error for text > 500 characters', () => {
      const longText = 'a'.repeat(501);
      expect(() =>
        Question.create('id', { ...validQuestionProps, text: longText }),
      ).toThrow('Question text cannot exceed 500 characters');
    });

    it('should accept text at minimum boundary (10 chars)', () => {
      const question = Question.create('id', {
        ...validQuestionProps,
        text: 'Ten chars!',
      });

      expect(question.text).toBe('Ten chars!');
    });

    it('should accept text at maximum boundary (500 chars)', () => {
      const maxText = 'a'.repeat(500);
      const question = Question.create('id', {
        ...validQuestionProps,
        text: maxText,
      });

      expect(question.text).toBe(maxText);
    });

    it('should throw error for timeLimit < 30', () => {
      expect(() =>
        Question.create('id', { ...validQuestionProps, timeLimit: 29 }),
      ).toThrow('Time limit must be at least 30 seconds');
    });

    it('should throw error for timeLimit = 0', () => {
      expect(() =>
        Question.create('id', { ...validQuestionProps, timeLimit: 0 }),
      ).toThrow('Time limit must be at least 30 seconds');
    });

    it('should throw error for timeLimit > 600', () => {
      expect(() =>
        Question.create('id', { ...validQuestionProps, timeLimit: 601 }),
      ).toThrow('Time limit cannot exceed 600 seconds');
    });

    it('should accept timeLimit at minimum boundary (30 seconds)', () => {
      const question = Question.create('id', {
        ...validQuestionProps,
        timeLimit: 30,
      });

      expect(question.timeLimit).toBe(30);
    });

    it('should accept timeLimit at maximum boundary (600 seconds)', () => {
      const question = Question.create('id', {
        ...validQuestionProps,
        timeLimit: 600,
      });

      expect(question.timeLimit).toBe(600);
    });

    it('should throw error for order < 1', () => {
      expect(() =>
        Question.create('id', { ...validQuestionProps, order: 0 }),
      ).toThrow('Question order must be a positive integer');
    });

    it('should throw error for negative order', () => {
      expect(() =>
        Question.create('id', { ...validQuestionProps, order: -1 }),
      ).toThrow('Question order must be a positive integer');
    });

    it('should accept order = 1', () => {
      const question = Question.create('id', {
        ...validQuestionProps,
        order: 1,
      });

      expect(question.order).toBe(1);
    });

    it('should throw error for hints > 200 characters', () => {
      const longHints = 'a'.repeat(201);
      expect(() =>
        Question.create('id', { ...validQuestionProps, hints: longHints }),
      ).toThrow('Hints cannot exceed 200 characters');
    });

    it('should accept optional hints as undefined', () => {
      const question = Question.create('id', {
        ...validQuestionProps,
        hints: undefined,
      });

      expect(question.hints).toBeUndefined();
    });

    it('should accept valid hints', () => {
      const question = Question.create('id', {
        ...validQuestionProps,
        hints: 'Some helpful hint',
      });

      expect(question.hints).toBe('Some helpful hint');
    });

    it('should set required flag to true', () => {
      const question = Question.create('id', {
        ...validQuestionProps,
        required: true,
      });

      expect(question.required).toBe(true);
    });

    it('should set required flag to false', () => {
      const question = Question.create('id', {
        ...validQuestionProps,
        required: false,
      });

      expect(question.required).toBe(false);
    });
  });

  describe('Reconstitute', () => {
    it('should reconstitute question with existing createdAt', () => {
      const existingDate = new Date('2024-01-01');
      const question = Question.reconstitute('id', {
        ...validQuestionProps,
        createdAt: existingDate,
      });

      expect(question.createdAt).toBe(existingDate);
    });
  });

  describe('Getters', () => {
    const question = Question.create('test-id', validQuestionProps);

    it('should return correct id', () => {
      expect(question.id).toBe('test-id');
    });

    it('should return correct text', () => {
      expect(question.text).toBe(validQuestionProps.text);
    });

    it('should return correct type', () => {
      expect(question.type.equals(validQuestionProps.type)).toBe(true);
    });

    it('should return correct order', () => {
      expect(question.order).toBe(1);
    });

    it('should return correct timeLimit', () => {
      expect(question.timeLimit).toBe(300);
    });

    it('should return correct required', () => {
      expect(question.required).toBe(true);
    });

    it('should return correct hints', () => {
      expect(question.hints).toBe('Mention specific projects');
    });

    it('should return correct createdAt', () => {
      expect(question.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Immutable Updates', () => {
    const original = Question.create('id', validQuestionProps);

    it('should update text immutably', () => {
      const updated = original.updateText(
        'What is your experience with React?',
      );

      expect(updated.text).toBe('What is your experience with React?');
      expect(updated.id).toBe(original.id);
      expect(original.text).toBe(validQuestionProps.text);
    });

    it('should update order immutably', () => {
      const updated = original.updateOrder(5);

      expect(updated.order).toBe(5);
      expect(original.order).toBe(1);
    });

    it('should update timeLimit immutably', () => {
      const updated = original.updateTimeLimit(120);

      expect(updated.timeLimit).toBe(120);
      expect(original.timeLimit).toBe(300);
    });

    it('should update hints immutably', () => {
      const updated = original.updateHints('New hint');

      expect(updated.hints).toBe('New hint');
      expect(original.hints).toBe('Mention specific projects');
    });

    it('should toggle required immutably', () => {
      const updated = original.toggleRequired();

      expect(updated.required).toBe(false);
      expect(original.required).toBe(true);

      const toggledBack = updated.toggleRequired();
      expect(toggledBack.required).toBe(true);
    });

    it('should keep original unchanged after multiple updates', () => {
      original.updateText('New text that is long enough');
      original.updateOrder(10);
      original.updateTimeLimit(500);
      original.toggleRequired();

      expect(original.text).toBe(validQuestionProps.text);
      expect(original.order).toBe(1);
      expect(original.timeLimit).toBe(300);
      expect(original.required).toBe(true);
    });
  });

  describe('Entity Equality', () => {
    it('should be equal when same ID', () => {
      const question1 = Question.create('same-id', validQuestionProps);
      const question2 = Question.create('same-id', {
        ...validQuestionProps,
        text: 'Different text but same ID makes it equal',
      });

      expect(question1.equals(question2)).toBe(true);
    });

    it('should not be equal when different ID', () => {
      const question1 = Question.create('id-1', validQuestionProps);
      const question2 = Question.create('id-2', validQuestionProps);

      expect(question1.equals(question2)).toBe(false);
    });

    it('should be equal to itself', () => {
      const question = Question.create('id', validQuestionProps);
      expect(question.equals(question)).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const question = Question.create('test-id', validQuestionProps);
      const json = question.toJSON();

      expect(json).toEqual({
        id: 'test-id',
        text: validQuestionProps.text,
        type: 'text',
        order: 1,
        timeLimit: 300,
        required: true,
        hints: 'Mention specific projects',
        options: undefined,
        createdAt: question.createdAt.toISOString(),
      });
    });

    it('should serialize multiple choice question with options', () => {
      const options = [
        QuestionOption.create({ id: 'opt-1', text: 'Paris', isCorrect: true }),
        QuestionOption.create({ id: 'opt-2', text: 'London', isCorrect: false }),
      ];

      const mcQuestion = Question.create('test-id', {
        ...validQuestionProps,
        type: QuestionType.multipleChoice(),
        options,
      });

      const json = mcQuestion.toJSON();

      expect(json.options).toEqual([
        { id: 'opt-1', text: 'Paris', isCorrect: true },
        { id: 'opt-2', text: 'London', isCorrect: false },
      ]);
    });
  });

  describe('Multiple Choice Validation', () => {
    const validOptions = [
      QuestionOption.create({ id: 'opt-1', text: 'Paris', isCorrect: true }),
      QuestionOption.create({ id: 'opt-2', text: 'London', isCorrect: false }),
      QuestionOption.create({ id: 'opt-3', text: 'Berlin', isCorrect: false }),
    ];

    it('should create multiple choice question with valid options', () => {
      const question = Question.create('id', {
        ...validQuestionProps,
        type: QuestionType.multipleChoice(),
        options: validOptions,
      });

      expect(question.type.value).toBe('multiple_choice');
      expect(question.options).toHaveLength(3);
      expect(question.options![0].text).toBe('Paris');
    });

    it('should throw error if multiple choice has less than 2 options', () => {
      expect(() =>
        Question.create('id', {
          ...validQuestionProps,
          type: QuestionType.multipleChoice(),
          options: [QuestionOption.create({ id: 'opt-1', text: 'Paris', isCorrect: true })],
        }),
      ).toThrow('Multiple choice questions must have at least 2 options');
    });

    it('should throw error if multiple choice has no options', () => {
      expect(() =>
        Question.create('id', {
          ...validQuestionProps,
          type: QuestionType.multipleChoice(),
          options: [],
        }),
      ).toThrow('Multiple choice questions must have at least 2 options');
    });

    it('should throw error if multiple choice has undefined options', () => {
      expect(() =>
        Question.create('id', {
          ...validQuestionProps,
          type: QuestionType.multipleChoice(),
          options: undefined,
        }),
      ).toThrow('Multiple choice questions must have at least 2 options');
    });

    it('should throw error if multiple choice has more than 10 options', () => {
      const tooManyOptions = Array.from({ length: 11 }, (_, i) =>
        QuestionOption.create({
          id: `opt-${i}`,
          text: `Option ${i}`,
          isCorrect: i === 0,
        }),
      );

      expect(() =>
        Question.create('id', {
          ...validQuestionProps,
          type: QuestionType.multipleChoice(),
          options: tooManyOptions,
        }),
      ).toThrow('Multiple choice questions cannot have more than 10 options');
    });

    it('should accept multiple choice with exactly 2 options (minimum)', () => {
      const minOptions = [
        QuestionOption.create({ id: 'opt-1', text: 'Yes', isCorrect: true }),
        QuestionOption.create({ id: 'opt-2', text: 'No', isCorrect: false }),
      ];

      const question = Question.create('id', {
        ...validQuestionProps,
        type: QuestionType.multipleChoice(),
        options: minOptions,
      });

      expect(question.options).toHaveLength(2);
    });

    it('should accept multiple choice with exactly 10 options (maximum)', () => {
      const maxOptions = Array.from({ length: 10 }, (_, i) =>
        QuestionOption.create({
          id: `opt-${i}`,
          text: `Option ${i}`,
          isCorrect: i === 0,
        }),
      );

      const question = Question.create('id', {
        ...validQuestionProps,
        type: QuestionType.multipleChoice(),
        options: maxOptions,
      });

      expect(question.options).toHaveLength(10);
    });

    it('should throw error if multiple choice has no correct answer', () => {
      const noCorrectOptions = [
        QuestionOption.create({ id: 'opt-1', text: 'Paris', isCorrect: false }),
        QuestionOption.create({ id: 'opt-2', text: 'London', isCorrect: false }),
      ];

      expect(() =>
        Question.create('id', {
          ...validQuestionProps,
          type: QuestionType.multipleChoice(),
          options: noCorrectOptions,
        }),
      ).toThrow('Multiple choice questions must have at least one correct answer');
    });

    it('should accept multiple choice with multiple correct answers', () => {
      const multipleCorrect = [
        QuestionOption.create({ id: 'opt-1', text: 'Paris', isCorrect: true }),
        QuestionOption.create({ id: 'opt-2', text: 'London', isCorrect: true }),
        QuestionOption.create({ id: 'opt-3', text: 'Berlin', isCorrect: false }),
      ];

      const question = Question.create('id', {
        ...validQuestionProps,
        type: QuestionType.multipleChoice(),
        options: multipleCorrect,
      });

      const correctCount = question.options!.filter((o) => o.isCorrect).length;
      expect(correctCount).toBe(2);
    });

    it('should throw error if video question has options', () => {
      expect(() =>
        Question.create('id', {
          ...validQuestionProps,
          type: QuestionType.video(),
          options: validOptions,
        }),
      ).toThrow('Only multiple choice questions can have options');
    });

    it('should throw error if text question has options', () => {
      expect(() =>
        Question.create('id', {
          ...validQuestionProps,
          type: QuestionType.text(),
          options: validOptions,
        }),
      ).toThrow('Only multiple choice questions can have options');
    });

    it('should accept video question without options', () => {
      const question = Question.create('id', {
        ...validQuestionProps,
        type: QuestionType.video(),
        options: undefined,
      });

      expect(question.options).toBeUndefined();
    });

    it('should accept text question without options', () => {
      const question = Question.create('id', {
        ...validQuestionProps,
        type: QuestionType.text(),
        options: undefined,
      });

      expect(question.options).toBeUndefined();
    });
  });
});
