import { Invitation, CompleteInvitationData } from '../invitation.aggregate';
import { Response } from '../../entities/response.entity';
import { ResponseType } from '../../value-objects/response-type.vo';
import { InvitationStatus } from '../../value-objects/invitation-status.vo';
import {
  InvitationCreatedEvent,
  InvitationStartedEvent,
  ResponseSubmittedEvent,
  InvitationCompletedEvent,
} from '../../events';

describe('Invitation Aggregate', () => {
  const templateId = 'template-123';
  const candidateId = 'candidate-456';
  const companyName = 'TechCorp Inc.';
  const invitedBy = 'hr-user-001';
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const totalQuestions = 5;

  const createValidInvitation = (id = 'invitation-1') => {
    return Invitation.create(
      id,
      templateId,
      candidateId,
      companyName,
      invitedBy,
      futureDate,
      totalQuestions,
      true, // allowPause
      true, // showTimer
    );
  };

  const createResponse = (questionId: string, index: number) => {
    return Response.create(`response-${index}`, {
      invitationId: 'invitation-1',
      questionId,
      questionIndex: index,
      questionText: `Question ${index + 1}?`,
      responseType: ResponseType.text(),
      textAnswer: `Answer to question ${index + 1}`,
      duration: 60,
    });
  };

  const createCompleteData = (userId: string | null, reason: 'manual' | 'auto_timeout' | 'expired' = 'manual'): CompleteInvitationData => ({
    userId,
    reason,
    templateTitle: 'Test Template',
    language: 'en',
    questions: [
      { id: 'q1', text: 'Question 1?', type: 'text', order: 0, timeLimit: 120 },
      { id: 'q2', text: 'Question 2?', type: 'text', order: 1, timeLimit: 120 },
    ],
  });

  describe('create', () => {
    it('should create a valid invitation', () => {
      const invitation = createValidInvitation();

      expect(invitation.id).toBe('invitation-1');
      expect(invitation.templateId).toBe(templateId);
      expect(invitation.candidateId).toBe(candidateId);
      expect(invitation.companyName).toBe(companyName);
      expect(invitation.invitedBy).toBe(invitedBy);
      expect(invitation.status.isPending()).toBe(true);
      expect(invitation.allowPause).toBe(true);
      expect(invitation.showTimer).toBe(true);
      expect(invitation.expiresAt).toEqual(futureDate);
      expect(invitation.totalQuestions).toBe(totalQuestions);
      expect(invitation.responses).toHaveLength(0);
      expect(invitation.startedAt).toBeUndefined();
      expect(invitation.completedAt).toBeUndefined();
    });

    it('should raise InvitationCreatedEvent', () => {
      const invitation = createValidInvitation();
      const events = invitation.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(InvitationCreatedEvent);
      expect(events[0].aggregateId).toBe('invitation-1');
      expect(events[0].templateId).toBe(templateId);
      expect(events[0].candidateId).toBe(candidateId);
    });

    it('should throw error for missing templateId', () => {
      expect(() =>
        Invitation.create(
          'inv-1',
          '',
          candidateId,
          companyName,
          invitedBy,
          futureDate,
          totalQuestions,
        ),
      ).toThrow('Template ID is required');
    });

    it('should throw error for missing candidateId', () => {
      expect(() =>
        Invitation.create(
          'inv-1',
          templateId,
          '',
          companyName,
          invitedBy,
          futureDate,
          totalQuestions,
        ),
      ).toThrow('Candidate ID is required');
    });

    it('should throw error for past expiration date', () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(() =>
        Invitation.create(
          'inv-1',
          templateId,
          candidateId,
          companyName,
          invitedBy,
          pastDate,
          totalQuestions,
        ),
      ).toThrow('Expiration date must be in the future');
    });

    it('should throw error for missing companyName', () => {
      expect(() =>
        Invitation.create(
          'inv-1',
          templateId,
          candidateId,
          '',
          invitedBy,
          futureDate,
          totalQuestions,
        ),
      ).toThrow('Company name is required');
    });

    it('should throw error for whitespace-only companyName', () => {
      expect(() =>
        Invitation.create(
          'inv-1',
          templateId,
          candidateId,
          '   ',
          invitedBy,
          futureDate,
          totalQuestions,
        ),
      ).toThrow('Company name is required');
    });

    it('should trim companyName', () => {
      const invitation = Invitation.create(
        'inv-1',
        templateId,
        candidateId,
        '  TechCorp Inc.  ',
        invitedBy,
        futureDate,
        totalQuestions,
      );
      expect(invitation.companyName).toBe('TechCorp Inc.');
    });

    it('should throw error for zero questions', () => {
      expect(() =>
        Invitation.create(
          'inv-1',
          templateId,
          candidateId,
          companyName,
          invitedBy,
          futureDate,
          0,
        ),
      ).toThrow('Template must have at least one question');
    });
  });

  describe('start', () => {
    it('should start the invitation', () => {
      const invitation = createValidInvitation();
      invitation.clearEvents();

      invitation.start(candidateId);

      expect(invitation.status.isInProgress()).toBe(true);
      expect(invitation.startedAt).toBeInstanceOf(Date);
      expect(invitation.lastActivityAt).toBeInstanceOf(Date);
    });

    it('should raise InvitationStartedEvent', () => {
      const invitation = createValidInvitation();
      invitation.clearEvents();

      invitation.start(candidateId);

      const events = invitation.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(InvitationStartedEvent);
      expect(events[0].candidateId).toBe(candidateId);
    });

    it('should throw error if wrong user tries to start', () => {
      const invitation = createValidInvitation();

      expect(() => invitation.start('other-user')).toThrow(
        'Only the invited candidate can start this interview',
      );
    });

    it('should throw error if already started', () => {
      const invitation = createValidInvitation();
      invitation.start(candidateId);

      expect(() => invitation.start(candidateId)).toThrow(
        'Interview can only be started from pending status',
      );
    });

    it('should throw error if expired', () => {
      const pastDate = new Date(Date.now() + 100); // Will expire soon
      const invitation = Invitation.create(
        'inv-1',
        templateId,
        candidateId,
        companyName,
        invitedBy,
        pastDate,
        totalQuestions,
      );

      // Wait for expiration
      jest.useFakeTimers();
      jest.advanceTimersByTime(200);

      expect(() => invitation.start(candidateId)).toThrow(
        'This invitation has expired',
      );

      jest.useRealTimers();
    });
  });

  describe('submitResponse', () => {
    it('should submit a response', () => {
      const invitation = createValidInvitation();
      invitation.start(candidateId);
      invitation.clearEvents();

      const response = createResponse('q1', 0);
      invitation.submitResponse(candidateId, response);

      expect(invitation.responses).toHaveLength(1);
      expect(invitation.responses[0].questionId).toBe('q1');
      expect(invitation.lastActivityAt).toBeInstanceOf(Date);
    });

    it('should raise ResponseSubmittedEvent', () => {
      const invitation = createValidInvitation();
      invitation.start(candidateId);
      invitation.clearEvents();

      const response = createResponse('q1', 0);
      invitation.submitResponse(candidateId, response);

      const events = invitation.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ResponseSubmittedEvent);
      expect(events[0].questionId).toBe('q1');
      expect(events[0].answeredCount).toBe(1);
      expect(events[0].totalQuestions).toBe(5);
    });

    it('should throw error if wrong user submits', () => {
      const invitation = createValidInvitation();
      invitation.start(candidateId);

      const response = createResponse('q1', 0);
      expect(() => invitation.submitResponse('other-user', response)).toThrow(
        'Only the invited candidate can submit responses',
      );
    });

    it('should throw error if not in progress', () => {
      const invitation = createValidInvitation();
      // Not started yet

      const response = createResponse('q1', 0);
      expect(() => invitation.submitResponse(candidateId, response)).toThrow(
        'Can only submit responses when interview is in progress',
      );
    });

    it('should throw error for duplicate response', () => {
      const invitation = createValidInvitation();
      invitation.start(candidateId);

      const response1 = createResponse('q1', 0);
      invitation.submitResponse(candidateId, response1);

      const response2 = createResponse('q1', 0);
      expect(() => invitation.submitResponse(candidateId, response2)).toThrow(
        'Response for this question already exists',
      );
    });
  });

  describe('complete', () => {
    it('should complete when all questions answered', () => {
      const invitation = Invitation.create(
        'inv-1',
        templateId,
        candidateId,
        companyName,
        invitedBy,
        futureDate,
        2, // only 2 questions
      );
      invitation.start(candidateId);

      invitation.submitResponse(candidateId, createResponse('q1', 0));
      invitation.submitResponse(candidateId, createResponse('q2', 1));
      invitation.clearEvents();

      invitation.complete(createCompleteData(candidateId, 'manual'));

      expect(invitation.status.isCompleted()).toBe(true);
      expect(invitation.completedAt).toBeInstanceOf(Date);
      expect(invitation.completedReason).toBe('manual');
    });

    it('should raise InvitationCompletedEvent', () => {
      const invitation = Invitation.create(
        'inv-1',
        templateId,
        candidateId,
        companyName,
        invitedBy,
        futureDate,
        2,
      );
      invitation.start(candidateId);
      invitation.submitResponse(candidateId, createResponse('q1', 0));
      invitation.submitResponse(candidateId, createResponse('q2', 1));
      invitation.clearEvents();

      invitation.complete(createCompleteData(candidateId, 'manual'));

      const events = invitation.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(InvitationCompletedEvent);
      expect(events[0].reason).toBe('manual');
      expect(events[0].answeredCount).toBe(2);
    });

    it('should throw error if not all questions answered for manual complete', () => {
      const invitation = Invitation.create(
        'inv-1',
        templateId,
        candidateId,
        companyName,
        invitedBy,
        futureDate,
        3,
      );
      invitation.start(candidateId);
      invitation.submitResponse(candidateId, createResponse('q1', 0));

      expect(() => invitation.complete(createCompleteData(candidateId, 'manual'))).toThrow(
        'All questions must be answered before completing. Answered: 1/3',
      );
    });

    it('should allow auto_timeout complete with partial answers', () => {
      const invitation = Invitation.create(
        'inv-1',
        templateId,
        candidateId,
        companyName,
        invitedBy,
        futureDate,
        3,
      );
      invitation.start(candidateId);
      invitation.submitResponse(candidateId, createResponse('q1', 0));

      // Auto-complete by system (null userId)
      invitation.complete(createCompleteData(null, 'auto_timeout'));

      expect(invitation.status.isCompleted()).toBe(true);
      expect(invitation.completedReason).toBe('auto_timeout');
    });

    it('should throw error if wrong user tries to complete', () => {
      const invitation = Invitation.create(
        'inv-1',
        templateId,
        candidateId,
        companyName,
        invitedBy,
        futureDate,
        1,
      );
      invitation.start(candidateId);
      invitation.submitResponse(candidateId, createResponse('q1', 0));

      expect(() => invitation.complete(createCompleteData('other-user', 'manual'))).toThrow(
        'Only the invited candidate can complete this interview',
      );
    });

    it('should throw error if not in progress', () => {
      const invitation = createValidInvitation();

      expect(() => invitation.complete(createCompleteData(candidateId, 'manual'))).toThrow(
        'Interview can only be completed when in progress',
      );
    });
  });

  describe('progress tracking', () => {
    it('should return correct progress', () => {
      const invitation = Invitation.create(
        'inv-1',
        templateId,
        candidateId,
        companyName,
        invitedBy,
        futureDate,
        4,
      );
      invitation.start(candidateId);

      expect(invitation.getProgress()).toEqual({
        answered: 0,
        total: 4,
        percentage: 0,
      });

      invitation.submitResponse(candidateId, createResponse('q1', 0));
      expect(invitation.getProgress()).toEqual({
        answered: 1,
        total: 4,
        percentage: 25,
      });

      invitation.submitResponse(candidateId, createResponse('q2', 1));
      expect(invitation.getProgress()).toEqual({
        answered: 2,
        total: 4,
        percentage: 50,
      });
    });

    it('should check if all questions answered', () => {
      const invitation = Invitation.create(
        'inv-1',
        templateId,
        candidateId,
        companyName,
        invitedBy,
        futureDate,
        2,
      );
      invitation.start(candidateId);

      expect(invitation.isAllQuestionsAnswered()).toBe(false);

      invitation.submitResponse(candidateId, createResponse('q1', 0));
      expect(invitation.isAllQuestionsAnswered()).toBe(false);

      invitation.submitResponse(candidateId, createResponse('q2', 1));
      expect(invitation.isAllQuestionsAnswered()).toBe(true);
    });

    it('should get answered question IDs', () => {
      const invitation = Invitation.create(
        'inv-1',
        templateId,
        candidateId,
        companyName,
        invitedBy,
        futureDate,
        3,
      );
      invitation.start(candidateId);

      invitation.submitResponse(candidateId, createResponse('q1', 0));
      invitation.submitResponse(candidateId, createResponse('q3', 2));

      expect(invitation.getAnsweredQuestionIds()).toEqual(['q1', 'q3']);
    });
  });

  describe('access control', () => {
    it('should correctly identify candidate', () => {
      const invitation = createValidInvitation();
      expect(invitation.isCandidate(candidateId)).toBe(true);
      expect(invitation.isCandidate('other-user')).toBe(false);
    });

    it('should correctly identify inviter', () => {
      const invitation = createValidInvitation();
      expect(invitation.isInviter(invitedBy)).toBe(true);
      expect(invitation.isInviter('other-user')).toBe(false);
    });

    it('should check access correctly', () => {
      const invitation = createValidInvitation();

      expect(invitation.canBeAccessedBy(candidateId)).toBe(true);
      expect(invitation.canBeAccessedBy(invitedBy)).toBe(true);
      expect(invitation.canBeAccessedBy('other-user')).toBe(false);
      expect(invitation.canBeAccessedBy('other-user', true)).toBe(true); // admin
    });
  });

  describe('updateLastActivity', () => {
    it('should update lastActivityAt', () => {
      const invitation = createValidInvitation();
      invitation.start(candidateId);
      const before = invitation.lastActivityAt;

      // Wait a bit
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      invitation.updateLastActivity();

      expect(invitation.lastActivityAt).not.toEqual(before);
      jest.useRealTimers();
    });
  });

  describe('markAsExpired', () => {
    it('should mark as expired', () => {
      const invitation = createValidInvitation();
      invitation.markAsExpired();

      expect(invitation.status.isExpired()).toBe(true);
    });

    it('should not change if already finished', () => {
      const invitation = Invitation.create(
        'inv-1',
        templateId,
        candidateId,
        companyName,
        invitedBy,
        futureDate,
        1,
      );
      invitation.start(candidateId);
      invitation.submitResponse(candidateId, createResponse('q1', 0));
      invitation.complete(createCompleteData(candidateId, 'manual'));

      invitation.markAsExpired();

      expect(invitation.status.isCompleted()).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persisted data', () => {
      const props = {
        id: 'inv-1',
        templateId,
        candidateId,
        companyName,
        invitedBy,
        status: InvitationStatus.inProgress(),
        allowPause: false,
        showTimer: false,
        expiresAt: futureDate,
        startedAt: new Date(),
        responses: [],
        totalQuestions: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const invitation = Invitation.reconstitute(props);

      expect(invitation.id).toBe('inv-1');
      expect(invitation.status.isInProgress()).toBe(true);
      expect(invitation.allowPause).toBe(false);
      expect(invitation.showTimer).toBe(false);
      expect(invitation.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const invitation = createValidInvitation();
      invitation.start(candidateId);
      invitation.submitResponse(candidateId, createResponse('q1', 0));

      const json = invitation.toJSON();

      expect(json.id).toBe('invitation-1');
      expect(json.templateId).toBe(templateId);
      expect(json.candidateId).toBe(candidateId);
      expect(json.status).toBe('in_progress');
      expect(json.allowPause).toBe(true);
      expect(json.showTimer).toBe(true);
      expect(json.responses).toHaveLength(1);
      expect(json.progress).toEqual({
        answered: 1,
        total: 5,
        percentage: 20,
      });
    });
  });
});
