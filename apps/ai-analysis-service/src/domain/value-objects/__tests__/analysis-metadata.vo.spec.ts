import { AnalysisMetadata } from '../analysis-metadata.vo';

describe('AnalysisMetadata Value Object', () => {
  describe('create', () => {
    it('should create metadata with all values', () => {
      const metadata = AnalysisMetadata.create(
        'llama-3.3-70b-versatile',
        5000,
        30000,
        10,
        'en',
      );

      expect(metadata.modelUsed).toBe('llama-3.3-70b-versatile');
      expect(metadata.totalTokensUsed).toBe(5000);
      expect(metadata.processingTimeMs).toBe(30000);
      expect(metadata.questionsAnalyzed).toBe(10);
      expect(metadata.language).toBe('en');
    });

    it('should use default language "en" when not provided', () => {
      const metadata = AnalysisMetadata.create('model', 1000, 5000, 5);
      expect(metadata.language).toBe('en');
    });
  });

  describe('empty', () => {
    it('should create empty metadata', () => {
      const metadata = AnalysisMetadata.empty();

      expect(metadata.modelUsed).toBe('');
      expect(metadata.totalTokensUsed).toBe(0);
      expect(metadata.processingTimeMs).toBe(0);
      expect(metadata.questionsAnalyzed).toBe(0);
      expect(metadata.language).toBe('en');
    });
  });

  describe('processingTimeSeconds', () => {
    it('should convert ms to seconds', () => {
      const metadata = AnalysisMetadata.create('model', 1000, 30500, 10);
      expect(metadata.processingTimeSeconds).toBe(31); // rounded
    });

    it('should return 0 for 0 ms', () => {
      const metadata = AnalysisMetadata.create('model', 1000, 0, 10);
      expect(metadata.processingTimeSeconds).toBe(0);
    });
  });

  describe('averageTokensPerQuestion', () => {
    it('should calculate average tokens per question', () => {
      const metadata = AnalysisMetadata.create('model', 5000, 30000, 10);
      expect(metadata.averageTokensPerQuestion).toBe(500);
    });

    it('should return 0 when questionsAnalyzed is 0', () => {
      const metadata = AnalysisMetadata.create('model', 5000, 30000, 0);
      expect(metadata.averageTokensPerQuestion).toBe(0);
    });

    it('should round the result', () => {
      const metadata = AnalysisMetadata.create('model', 1000, 30000, 3);
      expect(metadata.averageTokensPerQuestion).toBe(333); // 1000/3 = 333.33 -> 333
    });
  });

  describe('equals', () => {
    it('should return true for same metadata', () => {
      const m1 = AnalysisMetadata.create('model', 1000, 5000, 10, 'en');
      const m2 = AnalysisMetadata.create('model', 1000, 5000, 10, 'en');
      expect(m1.equals(m2)).toBe(true);
    });

    it('should return false for different model', () => {
      const m1 = AnalysisMetadata.create('model1', 1000, 5000, 10, 'en');
      const m2 = AnalysisMetadata.create('model2', 1000, 5000, 10, 'en');
      expect(m1.equals(m2)).toBe(false);
    });

    it('should return false for different tokens', () => {
      const m1 = AnalysisMetadata.create('model', 1000, 5000, 10, 'en');
      const m2 = AnalysisMetadata.create('model', 2000, 5000, 10, 'en');
      expect(m1.equals(m2)).toBe(false);
    });

    it('should return false for different language', () => {
      const m1 = AnalysisMetadata.create('model', 1000, 5000, 10, 'en');
      const m2 = AnalysisMetadata.create('model', 1000, 5000, 10, 'ru');
      expect(m1.equals(m2)).toBe(false);
    });
  });
});
