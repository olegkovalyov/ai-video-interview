import { Test, TestingModule } from '@nestjs/testing';
import { DeleteCompanyHandler } from '../delete-company.handler';
import { DeleteCompanyCommand } from '../delete-company.command';
import { Company } from '../../../../../domain/aggregates/company.aggregate';
import { CompanySize } from '../../../../../domain/value-objects/company-size.vo';
import {
  CompanyNotFoundException,
  CompanyAccessDeniedException,
} from '../../../../../domain/exceptions/company.exceptions';
import { COMPANY_EVENT_TYPES } from '../../../../../domain/constants';
import { LoggerService } from '../../../../../infrastructure/logger/logger.service';

describe('DeleteCompanyHandler', () => {
  let handler: DeleteCompanyHandler;

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
        DeleteCompanyHandler,
        { provide: 'ICompanyRepository', useValue: mockCompanyRepository },
        { provide: 'IOutboxService', useValue: mockOutboxService },
        { provide: 'IUnitOfWork', useValue: mockUnitOfWork },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    handler = module.get<DeleteCompanyHandler>(DeleteCompanyHandler);
  });

  const createCompany = (
    id: string = 'company-id-1',
    createdBy: string = 'hr-user-id',
  ): Company => {
    return Company.reconstitute(
      id,
      'Test Company',
      'Description',
      'https://company.com',
      'https://company.com/logo.png',
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
    it('should delete existing company', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      const command = new DeleteCompanyCommand('company-id-1', 'hr-user-id');

      // Act
      await handler.execute(command);

      // Assert - UnitOfWork was called
      expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);

      // Assert - Outbox event saved within transaction (BEFORE delete)
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        COMPANY_EVENT_TYPES.DELETED,
        expect.objectContaining({
          companyId: 'company-id-1',
          deletedBy: 'hr-user-id',
        }),
        'company-id-1',
        {}, // tx context from UoW
      );

      // Assert - Company deleted within transaction
      expect(mockCompanyRepository.delete).toHaveBeenCalledWith(
        'company-id-1',
        {}, // tx context from UoW
      );

      // Assert - schedulePublishing called after UoW commit
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith(['mock-event-id']);
    });

    it('should include deletedAt in outbox event payload', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      const command = new DeleteCompanyCommand('company-id-1', 'hr-user-id');

      // Act
      await handler.execute(command);

      // Assert
      const saveEventCall = mockOutboxService.saveEvent.mock.calls[0];
      const payload = saveEventCall[1];
      expect(payload.deletedAt).toBeDefined();
      expect(typeof payload.deletedAt).toBe('string');
      expect(payload.deletedBy).toBe('hr-user-id');
    });
  });

  describe('Error Cases', () => {
    it('should throw CompanyNotFoundException when company not found', async () => {
      // Arrange
      mockCompanyRepository.findById.mockResolvedValue(null);

      const command = new DeleteCompanyCommand('non-existent-id', 'hr-user-id');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CompanyNotFoundException);

      // Assert - No saves/deletes attempted
      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockOutboxService.saveEvent).not.toHaveBeenCalled();
      expect(mockCompanyRepository.delete).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });

    it('should throw CompanyAccessDeniedException when user is not creator', async () => {
      // Arrange
      const company = createCompany('company-id-1', 'original-creator-id');
      mockCompanyRepository.findById.mockResolvedValue(company);

      const command = new DeleteCompanyCommand('company-id-1', 'different-user-id');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CompanyAccessDeniedException);

      // Assert - No saves/deletes attempted
      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockCompanyRepository.delete).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });
  });

  describe('Transaction Behavior', () => {
    it('should execute outbox save BEFORE delete inside UoW', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      const executionOrder: string[] = [];
      mockOutboxService.saveEvent.mockImplementation(async () => {
        executionOrder.push('outbox.saveEvent');
        return 'mock-event-id';
      });
      mockCompanyRepository.delete.mockImplementation(async () => {
        executionOrder.push('company.delete');
      });

      const command = new DeleteCompanyCommand('company-id-1', 'hr-user-id');

      // Act
      await handler.execute(command);

      // Assert - Outbox save comes BEFORE delete (important for FK constraints)
      expect(executionOrder).toEqual([
        'outbox.saveEvent',
        'company.delete',
      ]);
    });

    it('should not call schedulePublishing if UoW fails', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);
      mockUnitOfWork.execute.mockRejectedValue(new Error('Transaction failed'));

      const command = new DeleteCompanyCommand('company-id-1', 'hr-user-id');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Transaction failed');
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });

    it('should rollback outbox save if delete fails', async () => {
      // Arrange
      const company = createCompany();
      mockCompanyRepository.findById.mockResolvedValue(company);

      // Simulate delete failing inside UoW, which should cause UoW to throw
      mockCompanyRepository.delete.mockRejectedValue(
        new Error('Delete failed'),
      );
      // Re-mock UoW to actually call the work function (not just pass through)
      mockUnitOfWork.execute.mockImplementation(async (work) => {
        return work({});
      });

      const command = new DeleteCompanyCommand('company-id-1', 'hr-user-id');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Delete failed');
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });
  });
});
