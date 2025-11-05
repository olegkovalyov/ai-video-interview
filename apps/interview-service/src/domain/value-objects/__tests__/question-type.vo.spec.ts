import { QuestionType, QuestionTypeEnum } from '../question-type.vo';

describe('QuestionType Value Object', () => {
  describe('Creation', () => {
    it('should create VIDEO type', () => {
      const type = QuestionType.video();
      expect(type.value).toBe(QuestionTypeEnum.VIDEO);
    });

    it('should create TEXT type', () => {
      const type = QuestionType.text();
      expect(type.value).toBe(QuestionTypeEnum.TEXT);
    });

    it('should create MULTIPLE_CHOICE type', () => {
      const type = QuestionType.multipleChoice();
      expect(type.value).toBe(QuestionTypeEnum.MULTIPLE_CHOICE);
    });

    it('should create from valid string "video"', () => {
      const type = QuestionType.create('video');
      expect(type.value).toBe(QuestionTypeEnum.VIDEO);
    });

    it('should create from valid string "text"', () => {
      const type = QuestionType.create('text');
      expect(type.value).toBe(QuestionTypeEnum.TEXT);
    });

    it('should create from valid string "multiple_choice"', () => {
      const type = QuestionType.create('multiple_choice');
      expect(type.value).toBe(QuestionTypeEnum.MULTIPLE_CHOICE);
    });

    it('should throw error for invalid string', () => {
      expect(() => QuestionType.create('invalid')).toThrow(
        'Invalid question type: invalid',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => QuestionType.create('')).toThrow('Invalid question type');
    });

    it('should throw error for uppercase string', () => {
      expect(() => QuestionType.create('VIDEO')).toThrow('Invalid question type');
    });
  });

  describe('Type Checking Methods', () => {
    it('should correctly identify video type', () => {
      const type = QuestionType.video();
      expect(type.isVideo()).toBe(true);
      expect(type.isText()).toBe(false);
      expect(type.isMultipleChoice()).toBe(false);
    });

    it('should correctly identify text type', () => {
      const type = QuestionType.text();
      expect(type.isText()).toBe(true);
      expect(type.isVideo()).toBe(false);
      expect(type.isMultipleChoice()).toBe(false);
    });

    it('should correctly identify multiple choice type', () => {
      const type = QuestionType.multipleChoice();
      expect(type.isMultipleChoice()).toBe(true);
      expect(type.isVideo()).toBe(false);
      expect(type.isText()).toBe(false);
    });
  });

  describe('Value Object Equality', () => {
    it('should be equal when same type', () => {
      const type1 = QuestionType.video();
      const type2 = QuestionType.video();
      expect(type1.equals(type2)).toBe(true);
    });

    it('should not be equal when different types', () => {
      const type1 = QuestionType.video();
      const type2 = QuestionType.text();
      expect(type1.equals(type2)).toBe(false);
    });

    it('should handle null in equals', () => {
      const type = QuestionType.video();
      expect(type.equals(null as any)).toBe(false);
    });

    it('should handle undefined in equals', () => {
      const type = QuestionType.video();
      expect(type.equals(undefined as any)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should convert VIDEO to string', () => {
      const type = QuestionType.video();
      expect(type.toString()).toBe('video');
    });

    it('should convert TEXT to string', () => {
      const type = QuestionType.text();
      expect(type.toString()).toBe('text');
    });

    it('should convert MULTIPLE_CHOICE to string', () => {
      const type = QuestionType.multipleChoice();
      expect(type.toString()).toBe('multiple_choice');
    });
  });
});
