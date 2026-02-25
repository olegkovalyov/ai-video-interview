import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { UpdateCompanyHandler } from '../update-company.handler';
import { UpdateCompanyCommand } from '../update-company.command';
import { Company } from '../../../../../domain/aggregates/company.aggregate';
import { CompanySize } from '../../../../../domain/value-objects/company-size.vo';
import {
  CompanyNotFoundException,
  CompanyAccessDeniedException,
} from '../../../../../domain/exceptions/company.exceptions';
import { COMPANY_EVENT_TYPES } from '../../../../../domain/constants';
import { LoggerService } from '../../../../../infrastructure/logger/logger.service';

describe('UpdateCompanyHandler', () => {
  let handler: UpdateCompanyHandler;

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
        UpdateCompanyHandler,
        { provide: 'ICompanyRepository', useValue: mockCompanyRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: 'IOutboxService', useValue: mockOutboxService },
        { provide: 'IUnitOfWork', useValue: mockUnitOfWork },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    handler = module.get<UpdateCompanyHandler>(UpdateCompanyHandler);
  });

  const createCompany = (
    id: string = 'company-id-1',
    createdBy: string = 'hr-user-id',
  ): Company => {
    return Company.reconstitute(
      id,
      'Original Name',
      'Original description',
      'https://original.com',
      'https://original.com/logo.png',
      'Technology',
      CompanySize.fromString('51-200'),
      'San Francisco, CA',
      true,
      createdBy,
      [], // users
      new Date(),
      new Date(),
    );
  };

  describe('Success Cases', () => {
    it('should update company name', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      const command = new UpdateCompanyCommand(
        'company-id-1',
        'Updated Name',
        'Original description',
        'https://original.com',
        'https://original.com/logo.png',
        'Technology',
        '51-200',
        'San Francisco, CA',
        'hr-user-id',
      );

      // Act
      await handler.execute(command);

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
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith(['mock-event-id']);

      // Assert - Domain events published via EventBus
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      const command = new UpdateCompanyCommand(
        'company-id-1',
        'New Name',
        'New description',
        'https://new.com',
        'https://new.com/logo.png',
        'Finance',
        '200+',
        'New York, NY',
        'hr-user-id',
      );

      // Act
      await handler.execute(command);

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
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith(['mock-event-id']);
    });

    it('should set optional fields to null', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      const command = new UpdateCompanyCommand(
        'company-id-1',
        'Original Name',
        null,
        null,
        null,
        null,
        null,
        null,
        'hr-user-id',
      );

      // Act
      await handler.execute(command);

      // Assert - save was called (fields changed to null)
      expect(mockCompanyRepository.save).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith(['mock-event-id']);
    });

    it('should include updatedAt in outbox event payload', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      const command = new UpdateCompanyCommand(
        'company-id-1',
        'New Name',
        null,
        null,
        null,
        null,
        null,
        null,
        'hr-user-id',
      );

      // Act
      await handler.execute(command);

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

      const command = new UpdateCompanyCommand(
        'non-existent-id',
        'Name',
        null,
        null,
        null,
        null,
        null,
        null,
        'hr-user-id',
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CompanyNotFoundException);

      // Assert - No saves attempted
      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockOutboxService.saveEvent).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });

    it('should throw CompanyAccessDeniedException when user is not creator', async () => {
      // Arrange
      const company = createCompany('company-id-1', 'original-creator-id');
      mockCompanyRepository.findById.mockResolvedValue(company);

      const command = new UpdateCompanyCommand(
        'company-id-1',
        'New Name',
        null,
        null,
        null,
        null,
        null,
        null,
        'different-user-id', // Not the creator
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CompanyAccessDeniedException);

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

      const command = new UpdateCompanyCommand(
        'company-id-1',
        'New Name',
        null,
        null,
        null,
        null,
        null,
        null,
        'hr-user-id',
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(executionOrder).toEqual([
        'company.save',
        'outbox.saveEvent',
      ]);
    });

    it('should not call schedulePublishing if UoW fails', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);
      mockUnitOfWork.execute.mockRejectedValue(new Error('Transaction failed'));

      const command = new UpdateCompanyCommand(
        'company-id-1',
        'New Name',
        null,
        null,
        null,
        null,
        null,
        null,
        'hr-user-id',
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Transaction failed');
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});
