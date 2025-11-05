import { InterviewSettings } from '../interview-settings.vo';

describe('InterviewSettings Value Object', () => {
  describe('Creation', () => {
    it('should create with valid values', () => {
      const settings = InterviewSettings.create({
        totalTimeLimit: 60,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });

      expect(settings.totalTimeLimit).toBe(60);
      expect(settings.allowRetakes).toBe(true);
      expect(settings.showTimer).toBe(false);
      expect(settings.randomizeQuestions).toBe(true);
    });

    it('should create default settings', () => {
      const settings = InterviewSettings.default();

      expect(settings.totalTimeLimit).toBe(60);
      expect(settings.allowRetakes).toBe(false);
      expect(settings.showTimer).toBe(true);
      expect(settings.randomizeQuestions).toBe(false);
    });

    it('should throw error for totalTimeLimit = 0', () => {
      expect(() =>
        InterviewSettings.create({
          totalTimeLimit: 0,
          allowRetakes: false,
          showTimer: true,
          randomizeQuestions: false,
        }),
      ).toThrow('Total time limit must be greater than 0');
    });

    it('should throw error for negative totalTimeLimit', () => {
      expect(() =>
        InterviewSettings.create({
          totalTimeLimit: -10,
          allowRetakes: false,
          showTimer: true,
          randomizeQuestions: false,
        }),
      ).toThrow('Total time limit must be greater than 0');
    });

    it('should throw error for totalTimeLimit > 480 minutes', () => {
      expect(() =>
        InterviewSettings.create({
          totalTimeLimit: 500,
          allowRetakes: false,
          showTimer: true,
          randomizeQuestions: false,
        }),
      ).toThrow('Total time limit cannot exceed 480 minutes');
    });

    it('should accept totalTimeLimit = 1 (minimum boundary)', () => {
      const settings = InterviewSettings.create({
        totalTimeLimit: 1,
        allowRetakes: false,
        showTimer: true,
        randomizeQuestions: false,
      });

      expect(settings.totalTimeLimit).toBe(1);
    });

    it('should accept totalTimeLimit = 480 (maximum boundary)', () => {
      const settings = InterviewSettings.create({
        totalTimeLimit: 480,
        allowRetakes: false,
        showTimer: true,
        randomizeQuestions: false,
      });

      expect(settings.totalTimeLimit).toBe(480);
    });
  });

  describe('Getters', () => {
    const settings = InterviewSettings.create({
      totalTimeLimit: 90,
      allowRetakes: true,
      showTimer: false,
      randomizeQuestions: true,
    });

    it('should return correct totalTimeLimit', () => {
      expect(settings.totalTimeLimit).toBe(90);
    });

    it('should return correct allowRetakes', () => {
      expect(settings.allowRetakes).toBe(true);
    });

    it('should return correct showTimer', () => {
      expect(settings.showTimer).toBe(false);
    });

    it('should return correct randomizeQuestions', () => {
      expect(settings.randomizeQuestions).toBe(true);
    });
  });

  describe('Immutable Updates', () => {
    const original = InterviewSettings.create({
      totalTimeLimit: 60,
      allowRetakes: false,
      showTimer: true,
      randomizeQuestions: false,
    });

    it('should create new instance with updated totalTimeLimit', () => {
      const updated = original.withTotalTimeLimit(90);

      expect(updated.totalTimeLimit).toBe(90);
      expect(updated.allowRetakes).toBe(false);
      expect(updated.showTimer).toBe(true);
      expect(updated.randomizeQuestions).toBe(false);
    });

    it('should create new instance with updated allowRetakes', () => {
      const updated = original.withAllowRetakes(true);

      expect(updated.allowRetakes).toBe(true);
      expect(updated.totalTimeLimit).toBe(60);
    });

    it('should create new instance with updated showTimer', () => {
      const updated = original.withShowTimer(false);

      expect(updated.showTimer).toBe(false);
      expect(updated.totalTimeLimit).toBe(60);
    });

    it('should create new instance with updated randomizeQuestions', () => {
      const updated = original.withRandomizeQuestions(true);

      expect(updated.randomizeQuestions).toBe(true);
      expect(updated.totalTimeLimit).toBe(60);
    });

    it('should NOT modify original instance after updates', () => {
      original.withTotalTimeLimit(120);
      original.withAllowRetakes(true);
      original.withShowTimer(false);
      original.withRandomizeQuestions(true);

      // Original should remain unchanged
      expect(original.totalTimeLimit).toBe(60);
      expect(original.allowRetakes).toBe(false);
      expect(original.showTimer).toBe(true);
      expect(original.randomizeQuestions).toBe(false);
    });
  });

  describe('Value Object Equality', () => {
    it('should be equal when all fields match', () => {
      const settings1 = InterviewSettings.create({
        totalTimeLimit: 60,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });

      const settings2 = InterviewSettings.create({
        totalTimeLimit: 60,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });

      expect(settings1.equals(settings2)).toBe(true);
    });

    it('should not be equal when totalTimeLimit differs', () => {
      const settings1 = InterviewSettings.create({
        totalTimeLimit: 60,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });

      const settings2 = InterviewSettings.create({
        totalTimeLimit: 90,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });

      expect(settings1.equals(settings2)).toBe(false);
    });

    it('should not be equal when allowRetakes differs', () => {
      const settings1 = InterviewSettings.create({
        totalTimeLimit: 60,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });

      const settings2 = InterviewSettings.create({
        totalTimeLimit: 60,
        allowRetakes: false,
        showTimer: false,
        randomizeQuestions: true,
      });

      expect(settings1.equals(settings2)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const settings = InterviewSettings.create({
        totalTimeLimit: 90,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });

      const json = settings.toJSON();

      expect(json).toEqual({
        totalTimeLimit: 90,
        allowRetakes: true,
        showTimer: false,
        randomizeQuestions: true,
      });
    });
  });
});
