import { Response } from '../response.entity';
import { ResponseType } from '../../value-objects/response-type.vo';

describe('Response Entity', () => {
  const validTextResponseProps = {
    invitationId: 'invitation-123',
    questionId: 'question-456',
    questionIndex: 0,
    questionText: 'What is your experience with React?',
    responseType: ResponseType.text(),
    textAnswer: 'I have 5 years of experience with React.',
    duration: 120,
  };

  const validCodeResponseProps = {
    invitationId: 'invitation-123',
    questionId: 'question-789',
    questionIndex: 1,
    questionText: 'Write a function to reverse a string.',
    responseType: ResponseType.code(),
    codeAnswer: 'function reverse(s) { return s.split("").reverse().join(""); }',
    duration: 180,
  };

  describe('create', () => {
    it('should create a valid text response', () => {
      const response = Response.create('resp-1', validTextResponseProps);

      expect(response.id).toBe('resp-1');
      expect(response.invitationId).toBe('invitation-123');
      expect(response.questionId).toBe('question-456');
      expect(response.questionIndex).toBe(0);
      expect(response.questionText).toBe('What is your experience with React?');
      expect(response.responseType.isText()).toBe(true);
      expect(response.textAnswer).toBe('I have 5 years of experience with React.');
      expect(response.duration).toBe(120);
      expect(response.submittedAt).toBeInstanceOf(Date);
    });

    it('should create a valid code response', () => {
      const response = Response.create('resp-2', validCodeResponseProps);

      expect(response.id).toBe('resp-2');
      expect(response.responseType.isCode()).toBe(true);
      expect(response.codeAnswer).toContain('function reverse');
    });

    it('should create a video response (coming soon)', () => {
      const response = Response.create('resp-3', {
        invitationId: 'invitation-123',
        questionId: 'question-999',
        questionIndex: 2,
        questionText: 'Tell us about yourself.',
        responseType: ResponseType.video(),
        videoUrl: 'https://example.com/video.mp4',
        duration: 60,
      });

      expect(response.responseType.isVideo()).toBe(true);
      expect(response.videoUrl).toBe('https://example.com/video.mp4');
    });
  });

  describe('validation', () => {
    it('should throw error for empty question text', () => {
      expect(() =>
        Response.create('resp-1', {
          ...validTextResponseProps,
          questionText: '',
        }),
      ).toThrow('Question text cannot be empty');
    });

    it('should throw error for negative question index', () => {
      expect(() =>
        Response.create('resp-1', {
          ...validTextResponseProps,
          questionIndex: -1,
        }),
      ).toThrow('Question index must be non-negative');
    });

    it('should throw error for negative duration', () => {
      expect(() =>
        Response.create('resp-1', {
          ...validTextResponseProps,
          duration: -10,
        }),
      ).toThrow('Duration cannot be negative');
    });

    it('should throw error for text response without text answer', () => {
      expect(() =>
        Response.create('resp-1', {
          ...validTextResponseProps,
          textAnswer: '',
        }),
      ).toThrow('Text answer is required for text response type');
    });

    it('should throw error for text answer exceeding limit', () => {
      expect(() =>
        Response.create('resp-1', {
          ...validTextResponseProps,
          textAnswer: 'a'.repeat(10001),
        }),
      ).toThrow('Text answer cannot exceed 10000 characters');
    });

    it('should throw error for code response without code answer', () => {
      expect(() =>
        Response.create('resp-1', {
          ...validCodeResponseProps,
          codeAnswer: '',
        }),
      ).toThrow('Code answer is required for code response type');
    });

    it('should throw error for code answer exceeding limit', () => {
      expect(() =>
        Response.create('resp-1', {
          ...validCodeResponseProps,
          codeAnswer: 'a'.repeat(50001),
        }),
      ).toThrow('Code answer cannot exceed 50000 characters');
    });

    it('should throw error for video URL exceeding limit', () => {
      expect(() =>
        Response.create('resp-1', {
          invitationId: 'invitation-123',
          questionId: 'question-999',
          questionIndex: 2,
          questionText: 'Tell us about yourself.',
          responseType: ResponseType.video(),
          videoUrl: 'https://example.com/' + 'a'.repeat(2000),
          duration: 60,
        }),
      ).toThrow('Video URL cannot exceed 2000 characters');
    });
  });

  describe('getAnswer', () => {
    it('should return text answer for text response', () => {
      const response = Response.create('resp-1', validTextResponseProps);
      expect(response.getAnswer()).toBe('I have 5 years of experience with React.');
    });

    it('should return code answer for code response', () => {
      const response = Response.create('resp-2', validCodeResponseProps);
      expect(response.getAnswer()).toContain('function reverse');
    });

    it('should return video URL for video response', () => {
      const response = Response.create('resp-3', {
        invitationId: 'invitation-123',
        questionId: 'question-999',
        questionIndex: 2,
        questionText: 'Tell us about yourself.',
        responseType: ResponseType.video(),
        videoUrl: 'https://example.com/video.mp4',
        duration: 60,
      });
      expect(response.getAnswer()).toBe('https://example.com/video.mp4');
    });
  });

  describe('hasContent', () => {
    it('should return true when response has content', () => {
      const response = Response.create('resp-1', validTextResponseProps);
      expect(response.hasContent()).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persisted data', () => {
      const submittedAt = new Date('2025-01-01T10:00:00Z');
      const response = Response.reconstitute('resp-1', {
        ...validTextResponseProps,
        submittedAt,
      });

      expect(response.id).toBe('resp-1');
      expect(response.submittedAt).toEqual(submittedAt);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const response = Response.create('resp-1', validTextResponseProps);
      const json = response.toJSON();

      expect(json.id).toBe('resp-1');
      expect(json.invitationId).toBe('invitation-123');
      expect(json.questionId).toBe('question-456');
      expect(json.responseType).toBe('text');
      expect(json.textAnswer).toBe('I have 5 years of experience with React.');
      expect(json.duration).toBe(120);
      expect(json.submittedAt).toBeDefined();
    });
  });

  describe('equals', () => {
    it('should return true for same id', () => {
      const response1 = Response.create('resp-1', validTextResponseProps);
      const response2 = Response.create('resp-1', validCodeResponseProps);
      expect(response1.equals(response2)).toBe(true);
    });

    it('should return false for different ids', () => {
      const response1 = Response.create('resp-1', validTextResponseProps);
      const response2 = Response.create('resp-2', validTextResponseProps);
      expect(response1.equals(response2)).toBe(false);
    });
  });
});
