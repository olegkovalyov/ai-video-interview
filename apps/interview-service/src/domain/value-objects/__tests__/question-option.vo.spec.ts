import { QuestionOption } from '../question-option.vo';

describe('QuestionOption Value Object', () => {
  describe('create', () => {
    it('should create a valid question option', () => {
      const option = QuestionOption.create({
        id: 'opt-1',
        text: 'Paris',
        isCorrect: true,
      });

      expect(option.id).toBe('opt-1');
      expect(option.text).toBe('Paris');
      expect(option.isCorrect).toBe(true);
    });

    it('should create option with long text (max 200 chars)', () => {
      const longText = 'A'.repeat(200);
      const option = QuestionOption.create({
        id: 'opt-1',
        text: longText,
        isCorrect: false,
      });

      expect(option.text).toBe(longText);
    });

    it('should throw error if ID is empty', () => {
      expect(() => {
        QuestionOption.create({
          id: '',
          text: 'Paris',
          isCorrect: true,
        });
      }).toThrow('Question option ID cannot be empty');
    });

    it('should throw error if ID is whitespace only', () => {
      expect(() => {
        QuestionOption.create({
          id: '   ',
          text: 'Paris',
          isCorrect: true,
        });
      }).toThrow('Question option ID cannot be empty');
    });

    it('should throw error if text is empty', () => {
      expect(() => {
        QuestionOption.create({
          id: 'opt-1',
          text: '',
          isCorrect: true,
        });
      }).toThrow('Question option text cannot be empty');
    });

    it('should throw error if text is whitespace only', () => {
      expect(() => {
        QuestionOption.create({
          id: 'opt-1',
          text: '   ',
          isCorrect: true,
        });
      }).toThrow('Question option text cannot be empty');
    });

    it('should throw error if text exceeds 200 characters', () => {
      const tooLongText = 'A'.repeat(201);
      expect(() => {
        QuestionOption.create({
          id: 'opt-1',
          text: tooLongText,
          isCorrect: true,
        });
      }).toThrow('Question option text cannot exceed 200 characters');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const option = QuestionOption.create({
        id: 'opt-123',
        text: 'London',
        isCorrect: false,
      });

      const json = option.toJSON();

      expect(json).toEqual({
        id: 'opt-123',
        text: 'London',
        isCorrect: false,
      });
    });
  });

  describe('equality', () => {
    it('should be equal to another option with same props', () => {
      const option1 = QuestionOption.create({
        id: 'opt-1',
        text: 'Paris',
        isCorrect: true,
      });

      const option2 = QuestionOption.create({
        id: 'opt-1',
        text: 'Paris',
        isCorrect: true,
      });

      expect(option1.equals(option2)).toBe(true);
    });

    it('should not be equal to option with different props', () => {
      const option1 = QuestionOption.create({
        id: 'opt-1',
        text: 'Paris',
        isCorrect: true,
      });

      const option2 = QuestionOption.create({
        id: 'opt-2',
        text: 'London',
        isCorrect: false,
      });

      expect(option1.equals(option2)).toBe(false);
    });
  });
});
