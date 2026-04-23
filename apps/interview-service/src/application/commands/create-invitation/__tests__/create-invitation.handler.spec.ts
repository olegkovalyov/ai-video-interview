import { EventBus } from '@nestjs/cqrs';
import { CreateInvitationHandler } from '../create-invitation.handler';
import { CreateInvitationCommand } from '../create-invitation.command';
import { TemplateNotFoundException } from '../../../../domain/exceptions/interview-template.exceptions';
import {
  InvalidInvitationDataException,
  DuplicateInvitationException,
} from '../../../../domain/exceptions/invitation.exceptions';
import { QuotaExceededException } from '../../../../domain/exceptions/quota.exceptions';
import type { IBillingClient } from '../../../interfaces/billing-client.interface';
import type { IInvitationRepository } from '../../../../domain/repositories/invitation.repository.interface';
import type { IInterviewTemplateRepository } from '../../../../domain/repositories/interview-template.repository.interface';
import type { IOutboxService } from '../../../interfaces/outbox-service.interface';
import type { IUnitOfWork } from '../../../interfaces/unit-of-work.interface';

describe('CreateInvitationHandler', () => {
  let handler: CreateInvitationHandler;

  let invitationRepo: jest.Mocked<IInvitationRepository>;
  let templateRepo: jest.Mocked<IInterviewTemplateRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let outbox: jest.Mocked<IOutboxService>;
  let uow: jest.Mocked<IUnitOfWork>;
  let billing: jest.Mocked<IBillingClient>;

  const activeTemplate = {
    id: 'tmpl-1',
    title: 'Backend Engineer',
    status: { isActive: () => true },
    getQuestionsCount: () => 3,
  };

  const baseCommand = new CreateInvitationCommand(
    'tmpl-1',
    'cand-1',
    'Acme Inc',
    'hr-1', // invitedBy → used as companyId
    new Date(Date.now() + 7 * 24 * 3600 * 1000),
  );

  beforeEach(() => {
    invitationRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      existsByCandidateAndTemplate: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<IInvitationRepository>;

    templateRepo = {
      findById: jest.fn().mockResolvedValue(activeTemplate as never),
    } as unknown as jest.Mocked<IInterviewTemplateRepository>;

    eventBus = { publish: jest.fn() } as unknown as jest.Mocked<EventBus>;

    outbox = {
      saveEvent: jest.fn().mockResolvedValue('evt-1'),
      schedulePublishing: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<IOutboxService>;

    uow = {
      execute: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
        fn({} as unknown),
      ),
    } as unknown as jest.Mocked<IUnitOfWork>;

    billing = {
      checkQuota: jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 2,
        limit: 3,
        currentPlan: 'free',
      }),
    } as unknown as jest.Mocked<IBillingClient>;

    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    handler = new CreateInvitationHandler(
      invitationRepo,
      templateRepo,
      eventBus,
      outbox,
      uow,
      billing,
      logger as never,
    );
  });

  it('creates invitation and checks quota against billing', async () => {
    const id = await handler.execute(baseCommand);

    expect(id).toBeDefined();
    expect(billing.checkQuota).toHaveBeenCalledWith('hr-1', 'interviews');
    expect(invitationRepo.save).toHaveBeenCalledTimes(1);
    expect(outbox.saveEvent).toHaveBeenCalledTimes(1);
    expect(outbox.schedulePublishing).toHaveBeenCalledWith(['evt-1']);
  });

  it('throws QuotaExceededException when plan limit reached and does NOT persist', async () => {
    billing.checkQuota.mockResolvedValue({
      allowed: false,
      remaining: 0,
      limit: 3,
      currentPlan: 'free',
    });

    await expect(handler.execute(baseCommand)).rejects.toBeInstanceOf(
      QuotaExceededException,
    );

    expect(invitationRepo.save).not.toHaveBeenCalled();
    expect(outbox.saveEvent).not.toHaveBeenCalled();
    expect(outbox.schedulePublishing).not.toHaveBeenCalled();
  });

  it('propagates fields from billing into QuotaExceededException', async () => {
    billing.checkQuota.mockResolvedValue({
      allowed: false,
      remaining: 0,
      limit: 3,
      currentPlan: 'free',
    });

    try {
      await handler.execute(baseCommand);
      fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(QuotaExceededException);
      expect((err as QuotaExceededException).resource).toBe('interviews');
      expect((err as QuotaExceededException).currentPlan).toBe('free');
      expect((err as QuotaExceededException).limit).toBe(3);
    }
  });

  it('does NOT call billing when template is missing', async () => {
    templateRepo.findById.mockResolvedValue(null as never);

    await expect(handler.execute(baseCommand)).rejects.toBeInstanceOf(
      TemplateNotFoundException,
    );

    expect(billing.checkQuota).not.toHaveBeenCalled();
  });

  it('does NOT call billing when template is not active', async () => {
    templateRepo.findById.mockResolvedValue({
      ...activeTemplate,
      status: { isActive: () => false },
    } as never);

    await expect(handler.execute(baseCommand)).rejects.toBeInstanceOf(
      InvalidInvitationDataException,
    );

    expect(billing.checkQuota).not.toHaveBeenCalled();
  });

  it('does NOT call billing on duplicate invitation', async () => {
    invitationRepo.existsByCandidateAndTemplate.mockResolvedValue(true);

    await expect(handler.execute(baseCommand)).rejects.toBeInstanceOf(
      DuplicateInvitationException,
    );

    expect(billing.checkQuota).not.toHaveBeenCalled();
  });

  it('treats billing failure as fail-open (unlimited quota returned) and still creates invitation', async () => {
    // HttpBillingClient fail-opens to allowed=true,limit=-1 on errors;
    // handler must honor that and proceed.
    billing.checkQuota.mockResolvedValue({
      allowed: true,
      remaining: -1,
      limit: -1,
      currentPlan: 'unknown',
    });

    const id = await handler.execute(baseCommand);

    expect(id).toBeDefined();
    expect(invitationRepo.save).toHaveBeenCalledTimes(1);
  });
});
