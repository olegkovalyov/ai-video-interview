import {
  DomainException,
  TemplateNotFoundException,
  TemplateCannotBePublishedException,
  TemplateAlreadyPublishedException,
  TemplateArchivedException,
  QuestionNotFoundException,
  InvalidTemplateStateException,
  DuplicateQuestionOrderException,
  InvalidQuestionException,
  TemplateUnauthorizedException,
  InvalidTemplateMetadataException,
} from '../interview-template.exceptions';

// Concrete implementation for testing abstract DomainException
class TestDomainException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

describe('Domain Exceptions', () => {
  describe('DomainException', () => {
    it('should create domain exception with message', () => {
      const exception = new TestDomainException('Test error message');

      expect(exception.message).toBe('Test error message');
      expect(exception.name).toBe('TestDomainException');
      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(DomainException);
    });

    it('should have stack trace', () => {
      const exception = new TestDomainException('Test error');

      expect(exception.stack).toBeDefined();
    });
  });

  describe('TemplateNotFoundException', () => {
    it('should create exception with template ID', () => {
      const exception = new TemplateNotFoundException('template-123');

      expect(exception.message).toBe(
        'Interview template with id template-123 not found',
      );
      expect(exception.name).toBe('TemplateNotFoundException');
    });

    it('should be instance of DomainException', () => {
      const exception = new TemplateNotFoundException('template-123');

      expect(exception).toBeInstanceOf(DomainException);
    });
  });

  describe('TemplateCannotBePublishedException', () => {
    it('should create exception with reason', () => {
      const exception = new TemplateCannotBePublishedException(
        'No questions added',
      );

      expect(exception.message).toBe(
        'Template cannot be published: No questions added',
      );
      expect(exception.name).toBe('TemplateCannotBePublishedException');
    });

    it('should be instance of DomainException', () => {
      const exception = new TemplateCannotBePublishedException('reason');

      expect(exception).toBeInstanceOf(DomainException);
    });
  });

  describe('TemplateAlreadyPublishedException', () => {
    it('should create exception with template ID', () => {
      const exception = new TemplateAlreadyPublishedException('template-123');

      expect(exception.message).toBe(
        'Template template-123 is already published',
      );
      expect(exception.name).toBe('TemplateAlreadyPublishedException');
    });

    it('should be instance of DomainException', () => {
      const exception = new TemplateAlreadyPublishedException('template-123');

      expect(exception).toBeInstanceOf(DomainException);
    });
  });

  describe('TemplateArchivedException', () => {
    it('should create exception with template ID', () => {
      const exception = new TemplateArchivedException('template-123');

      expect(exception.message).toBe(
        'Template template-123 is archived and cannot be modified',
      );
      expect(exception.name).toBe('TemplateArchivedException');
    });

    it('should be instance of DomainException', () => {
      const exception = new TemplateArchivedException('template-123');

      expect(exception).toBeInstanceOf(DomainException);
    });
  });

  describe('InvalidTemplateStateException', () => {
    it('should create exception with operation and current state', () => {
      const exception = new InvalidTemplateStateException(
        'publish',
        'archived',
      );

      expect(exception.message).toBe(
        'Cannot publish template in archived state',
      );
      expect(exception.name).toBe('InvalidTemplateStateException');
    });

    it('should be instance of DomainException', () => {
      const exception = new InvalidTemplateStateException('modify', 'active');

      expect(exception).toBeInstanceOf(DomainException);
    });
  });

  describe('QuestionNotFoundException', () => {
    it('should create exception with question ID', () => {
      const exception = new QuestionNotFoundException('question-456');

      expect(exception.message).toBe(
        'Question with id question-456 not found in template',
      );
      expect(exception.name).toBe('QuestionNotFoundException');
    });

    it('should be instance of DomainException', () => {
      const exception = new QuestionNotFoundException('question-456');

      expect(exception).toBeInstanceOf(DomainException);
    });
  });

  describe('DuplicateQuestionOrderException', () => {
    it('should create exception with order number', () => {
      const exception = new DuplicateQuestionOrderException(5);

      expect(exception.message).toBe(
        'Question with order 5 already exists in template',
      );
      expect(exception.name).toBe('DuplicateQuestionOrderException');
    });

    it('should be instance of DomainException', () => {
      const exception = new DuplicateQuestionOrderException(5);

      expect(exception).toBeInstanceOf(DomainException);
    });
  });

  describe('InvalidQuestionException', () => {
    it('should create exception with reason', () => {
      const exception = new InvalidQuestionException('Text is too short');

      expect(exception.message).toBe('Invalid question: Text is too short');
      expect(exception.name).toBe('InvalidQuestionException');
    });

    it('should be instance of DomainException', () => {
      const exception = new InvalidQuestionException('reason');

      expect(exception).toBeInstanceOf(DomainException);
    });
  });

  describe('TemplateUnauthorizedException', () => {
    it('should create exception with user and template IDs', () => {
      const exception = new TemplateUnauthorizedException(
        'user-789',
        'template-123',
      );

      expect(exception.message).toBe(
        'User user-789 is not authorized to access template template-123',
      );
      expect(exception.name).toBe('TemplateUnauthorizedException');
    });

    it('should be instance of DomainException', () => {
      const exception = new TemplateUnauthorizedException(
        'user-789',
        'template-123',
      );

      expect(exception).toBeInstanceOf(DomainException);
    });
  });

  describe('InvalidTemplateMetadataException', () => {
    it('should create exception with field and reason', () => {
      const exception = new InvalidTemplateMetadataException(
        'title',
        'cannot be empty',
      );

      expect(exception.message).toBe('Invalid template title: cannot be empty');
      expect(exception.name).toBe('InvalidTemplateMetadataException');
    });

    it('should be instance of DomainException', () => {
      const exception = new InvalidTemplateMetadataException(
        'description',
        'too long',
      );

      expect(exception).toBeInstanceOf(DomainException);
    });
  });

  describe('Exception Inheritance', () => {
    it('all exceptions should be catchable as DomainException', () => {
      const exceptions = [
        new TemplateNotFoundException('id'),
        new TemplateCannotBePublishedException('reason'),
        new TemplateAlreadyPublishedException('id'),
        new TemplateArchivedException('id'),
        new InvalidTemplateStateException('operation', 'state'),
        new QuestionNotFoundException('id'),
        new DuplicateQuestionOrderException(1),
        new InvalidQuestionException('reason'),
        new TemplateUnauthorizedException('userId', 'templateId'),
        new InvalidTemplateMetadataException('field', 'reason'),
      ];

      exceptions.forEach((exception) => {
        expect(exception).toBeInstanceOf(DomainException);
        expect(exception).toBeInstanceOf(Error);
      });
    });
  });

  describe('Exception Throwing', () => {
    it('should be throwable and catchable', () => {
      expect(() => {
        throw new TemplateNotFoundException('template-123');
      }).toThrow(TemplateNotFoundException);

      expect(() => {
        throw new TemplateNotFoundException('template-123');
      }).toThrow('Interview template with id template-123 not found');
    });

    it('should be catchable as DomainException', () => {
      try {
        throw new QuestionNotFoundException('question-456');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect(error).toBeInstanceOf(QuestionNotFoundException);
      }
    });
  });
});
