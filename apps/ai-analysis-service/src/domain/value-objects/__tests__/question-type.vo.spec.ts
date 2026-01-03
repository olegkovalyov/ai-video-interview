import { QuestionType, QuestionTypeEnum } from '../question-type.vo';

describe('QuestionType Value Object', () => {
  describe('factory methods', () => {
    it('should create text type', () => {
      const type = QuestionType.text();
      expect(type.value).toBe(QuestionTypeEnum.TEXT);
      expect(type.isText).toBe(true);
    });

    it('should create multiple_choice type', () => {
      const type = QuestionType.multipleChoice();
      expect(type.value).toBe(QuestionTypeEnum.MULTIPLE_CHOICE);
      expect(type.isMultipleChoice).toBe(true);
    });

    it('should create video type', () => {
      const type = QuestionType.video();
      expect(type.value).toBe(QuestionTypeEnum.VIDEO);
      expect(type.isVideo).toBe(true);
    });

    it('should create code type', () => {
      const type = QuestionType.code();
      expect(type.value).toBe(QuestionTypeEnum.CODE);
      expect(type.isCode).toBe(true);
    });
  });

  describe('fromString', () => {
    it('should create type from valid string', () => {
      expect(QuestionType.fromString('text').isText).toBe(true);
      expect(QuestionType.fromString('multiple_choice').isMultipleChoice).toBe(true);
      expect(QuestionType.fromString('video').isVideo).toBe(true);
      expect(QuestionType.fromString('code').isCode).toBe(true);
    });

    it('should throw error for invalid string', () => {
      expect(() => QuestionType.fromString('invalid')).toThrow('Invalid question type');
    });
  });

  describe('requiresLLMAnalysis', () => {
    it('should return true for text type', () => {
      expect(QuestionType.text().requiresLLMAnalysis).toBe(true);
    });

    it('should return true for code type', () => {
      expect(QuestionType.code().requiresLLMAnalysis).toBe(true);
    });

    it('should return false for multiple_choice type', () => {
      expect(QuestionType.multipleChoice().requiresLLMAnalysis).toBe(false);
    });

    it('should return false for video type', () => {
      expect(QuestionType.video().requiresLLMAnalysis).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same type', () => {
      const type1 = QuestionType.text();
      const type2 = QuestionType.text();
      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different types', () => {
      const type1 = QuestionType.text();
      const type2 = QuestionType.code();
      expect(type1.equals(type2)).toBe(false);
    });
  });
});
