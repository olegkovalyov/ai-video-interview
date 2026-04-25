import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CompanyUpdateService } from '../company-update.service';
import { Company } from '../../../domain/aggregates/company.aggregate';
import { CompanySize } from '../../../domain/value-objects/company-size.vo';
import {
  CompanyNotFoundException,
  CompanyAccessDeniedException,
} from '../../../domain/exceptions/company.exceptions';
import { COMPANY_EVENT_TYPES } from '../../../domain/constants';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

describe('CompanyUpdateService', () => {
  let service: CompanyUpdateService;

  const mockCompanyRepository = {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    delete: jest.fn(),
    isUserInCompany: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn(),
    publishAll: jest.fn(),
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
        CompanyUpdateService,
        { provide: 'ICompanyRepository', useValue: mockCompanyRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: 'IOutboxService', useValue: mockOutboxService },
        { provide: 'IUnitOfWork', useValue: mockUnitOfWork },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<CompanyUpdateService>(CompanyUpdateService);
  });

  const createCompany = (
    id: string = 'company-id-1',
    createdBy: string = 'hr-user-id',
  ): Company => {
    return Company.reconstitute({
      id,
      name: 'Original Name',
      description: 'Original description',
      website: 'https://original.com',
      logoUrl: 'https://original.com/logo.png',
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
    it('should update company name', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      // Act
      await service.update({
        companyId: 'company-id-1',
        name: 'Updated Name',
        description: 'Original description',
        website: 'https://original.com',
        logoUrl: 'https://original.com/logo.png',
        industry: 'Technology',
        size: '51-200',
        location: 'San Francisco, CA',
        userId: 'hr-user-id',
      });

      // Assert - UnitOfWork was called
      expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);

      // Assert - Company saved within transaction
      expect(mockCompanyRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCompanyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'company-id-1' }),
        {}, // tx context from UoW
      );

      // Assert - Outbox event saved within transaction with 4 args
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        COMPANY_EVENT_TYPES.UPDATED,
        expect.objectContaining({
          companyId: 'company-id-1',
        }),
        'company-id-1',
        {}, // tx context from UoW
      );

      // Assert - schedulePublishing called after UoW commit
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
        'mock-event-id',
      ]);

      // Assert - Domain events published via EventBus
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      // Act
      await service.update({
        companyId: 'company-id-1',
        name: 'New Name',
        description: 'New description',
        website: 'https://new.com',
        logoUrl: 'https://new.com/logo.png',
        industry: 'Finance',
        size: '200+',
        location: 'New York, NY',
        userId: 'hr-user-id',
      });

      // Assert
      expect(mockCompanyRepository.save).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        COMPANY_EVENT_TYPES.UPDATED,
        expect.objectContaining({
          companyId: 'company-id-1',
          name: 'New Name',
        }),
        'company-id-1',
        {}, // tx context
      );
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
        'mock-event-id',
      ]);
    });

    it('should set optional fields to null', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      // Act
      await service.update({
        companyId: 'company-id-1',
        name: 'Original Name',
        description: null,
        website: null,
        logoUrl: null,
        industry: null,
        size: null,
        location: null,
        userId: 'hr-user-id',
      });

      // Assert - save was called (fields changed to null)
      expect(mockCompanyRepository.save).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
        'mock-event-id',
      ]);
    });

    it('should include updatedAt in outbox event payload', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      // Act
      await service.update({
        companyId: 'company-id-1',
        name: 'New Name',
        description: null,
        website: null,
        logoUrl: null,
        industry: null,
        size: null,
        location: null,
        userId: 'hr-user-id',
      });

      // Assert
      const saveEventCall = mockOutboxService.saveEvent.mock.calls[0];
      const payload = saveEventCall[1];
      expect(payload.updatedAt).toBeDefined();
      expect(typeof payload.updatedAt).toBe('string');
    });
  });

  describe('Error Cases', () => {
    it('should throw CompanyNotFoundException when company not found', async () => {
      // Arrange
      mockCompanyRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update({
          companyId: 'non-existent-id',
          name: 'Name',
          description: null,
          website: null,
          logoUrl: null,
          industry: null,
          size: null,
          location: null,
          userId: 'hr-user-id',
        }),
      ).rejects.toThrow(CompanyNotFoundException);

      // Assert - No saves attempted
      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockOutboxService.saveEvent).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });

    it('should throw CompanyAccessDeniedException when user is not creator', async () => {
      // Arrange
      const company = createCompany('company-id-1', 'original-creator-id');
      mockCompanyRepository.findById.mockResolvedValue(company);

      // Act & Assert
      await expect(
        service.update({
          companyId: 'company-id-1',
          name: 'New Name',
          description: null,
          website: null,
          logoUrl: null,
          industry: null,
          size: null,
          location: null,
          userId: 'different-user-id', // Not the creator
        }),
      ).rejects.toThrow(CompanyAccessDeniedException);

      // Assert - No saves attempted
      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });
  });

  describe('Transaction Behavior', () => {
    it('should execute company save and outbox save inside UoW', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      const executionOrder: string[] = [];
      mockCompanyRepository.save.mockImplementation(async () => {
        executionOrder.push('company.save');
      });
      mockOutboxService.saveEvent.mockImplementation(async () => {
        executionOrder.push('outbox.saveEvent');
        return 'mock-event-id';
      });

      // Act
      await service.update({
        companyId: 'company-id-1',
        name: 'New Name',
        description: null,
        website: null,
        logoUrl: null,
        industry: null,
        size: null,
        location: null,
        userId: 'hr-user-id',
      });

      // Assert
      expect(executionOrder).toEqual(['company.save', 'outbox.saveEvent']);
    });

    it('should not call schedulePublishing if UoW fails', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);
      mockUnitOfWork.execute.mockRejectedValue(new Error('Transaction failed'));

      // Act & Assert
      await expect(
        service.update({
          companyId: 'company-id-1',
          name: 'New Name',
          description: null,
          website: null,
          logoUrl: null,
          industry: null,
          size: null,
          location: null,
          userId: 'hr-user-id',
        }),
      ).rejects.toThrow('Transaction failed');
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});
