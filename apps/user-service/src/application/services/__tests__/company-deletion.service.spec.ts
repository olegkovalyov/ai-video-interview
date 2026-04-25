import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CompanyDeletionService } from '../company-deletion.service';
import { Company } from '../../../domain/aggregates/company.aggregate';
import { CompanySize } from '../../../domain/value-objects/company-size.vo';
import {
  CompanyNotFoundException,
  CompanyAccessDeniedException,
} from '../../../domain/exceptions/company.exceptions';
import { COMPANY_EVENT_TYPES } from '../../../domain/constants';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

describe('CompanyDeletionService', () => {
  let service: CompanyDeletionService;

  const mockCompanyRepository = {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    isUserInCompany: jest.fn(),
  };

  const mockOutboxService = {
    saveEvent: jest.fn().mockResolvedValue('mock-event-id'),
    saveEvents: jest.fn().mockResolvedValue([]),
    schedulePublishing: jest.fn().mockResolvedValue(undefined),
  };

  const mockUnitOfWork = {
    execute: jest.fn().mockImplementation(async (work) => work({})),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyDeletionService,
        { provide: 'ICompanyRepository', useValue: mockCompanyRepository },
        { provide: 'IOutboxService', useValue: mockOutboxService },
        { provide: 'IUnitOfWork', useValue: mockUnitOfWork },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<CompanyDeletionService>(CompanyDeletionService);
  });

  const createCompany = (
    id: string = 'company-id-1',
    createdBy: string = 'hr-user-id',
  ): Company => {
    return Company.reconstitute({
      id,
      name: 'Test Company',
      description: 'Description',
      website: 'https://company.com',
      logoUrl: 'https://company.com/logo.png',
      industry: 'Technology',
      size: CompanySize.fromString('51-200'),
      location: 'San Francisco, CA',
      isActive: true,
      createdBy,
      users: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  describe('Success Cases', () => {
    it('should delete existing company', async () => {
      mockCompanyRepository.findById.mockResolvedValue(createCompany());

      await service.delete({
        companyId: 'company-id-1',
        userId: 'hr-user-id',
      });

      expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        COMPANY_EVENT_TYPES.DELETED,
        expect.objectContaining({
          companyId: 'company-id-1',
          deletedBy: 'hr-user-id',
        }),
        'company-id-1',
        {},
      );
      expect(mockCompanyRepository.delete).toHaveBeenCalledWith(
        'company-id-1',
        {},
      );
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
        'mock-event-id',
      ]);
    });

    it('should include deletedAt in outbox event payload', async () => {
      mockCompanyRepository.findById.mockResolvedValue(createCompany());

      await service.delete({
        companyId: 'company-id-1',
        userId: 'hr-user-id',
      });

      const payload = mockOutboxService.saveEvent.mock.calls[0][1];
      expect(payload.deletedAt).toBeDefined();
      expect(typeof payload.deletedAt).toBe('string');
      expect(payload.deletedBy).toBe('hr-user-id');
    });
  });

  describe('Error Cases', () => {
    it('should throw CompanyNotFoundException when company not found', async () => {
      mockCompanyRepository.findById.mockResolvedValue(null);

      await expect(
        service.delete({ companyId: 'non-existent-id', userId: 'hr-user-id' }),
      ).rejects.toThrow(CompanyNotFoundException);

      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockOutboxService.saveEvent).not.toHaveBeenCalled();
      expect(mockCompanyRepository.delete).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });

    it('should throw CompanyAccessDeniedException when user is not creator', async () => {
      mockCompanyRepository.findById.mockResolvedValue(
        createCompany('company-id-1', 'original-creator-id'),
      );

      await expect(
        service.delete({
          companyId: 'company-id-1',
          userId: 'different-user-id',
        }),
      ).rejects.toThrow(CompanyAccessDeniedException);

      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockCompanyRepository.delete).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });
  });

  describe('Transaction Behavior', () => {
    it('should execute outbox save BEFORE delete inside UoW', async () => {
      mockCompanyRepository.findById.mockResolvedValue(createCompany());

      const order: string[] = [];
      mockOutboxService.saveEvent.mockImplementation(async () => {
        order.push('outbox.saveEvent');
        return 'mock-event-id';
      });
      mockCompanyRepository.delete.mockImplementation(async () => {
        order.push('company.delete');
      });

      await service.delete({
        companyId: 'company-id-1',
        userId: 'hr-user-id',
      });

      // Outbox save comes BEFORE delete — payload must survive the delete row.
      expect(order).toEqual(['outbox.saveEvent', 'company.delete']);
    });

    it('should not call schedulePublishing if UoW fails', async () => {
      mockCompanyRepository.findById.mockResolvedValue(createCompany());
      mockUnitOfWork.execute.mockRejectedValue(new Error('Transaction failed'));

      await expect(
        service.delete({
          companyId: 'company-id-1',
          userId: 'hr-user-id',
        }),
      ).rejects.toThrow('Transaction failed');
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });

    it('should rollback outbox save if delete fails', async () => {
      mockCompanyRepository.findById.mockResolvedValue(createCompany());
      mockCompanyRepository.delete.mockRejectedValue(
        new Error('Delete failed'),
      );
      mockUnitOfWork.execute.mockImplementation(async (work) => work({}));

      await expect(
        service.delete({
          companyId: 'company-id-1',
          userId: 'hr-user-id',
        }),
      ).rejects.toThrow('Delete failed');
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });
  });
});
