import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateCompanyHandler } from '../create-company.handler';
import { CreateCompanyCommand } from '../create-company.command';
import { COMPANY_EVENT_TYPES } from '../../../../../domain/constants';
import { LoggerService } from '../../../../../infrastructure/logger/logger.service';

// Mock uuid to return predictable values
jest.mock('uuid', () => ({
  v4: jest
    .fn()
    .mockReturnValueOnce('mock-company-id')
    .mockReturnValueOnce('mock-user-company-id'),
}));

describe('CreateCompanyHandler', () => {
  let handler: CreateCompanyHandler;

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

    // Re-mock uuid for each test
    const uuidMock = require('uuid');
    uuidMock.v4
      .mockReset()
      .mockReturnValueOnce('mock-company-id')
      .mockReturnValueOnce('mock-user-company-id');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCompanyHandler,
        { provide: 'ICompanyRepository', useValue: mockCompanyRepository },
        { provide: EventBus, useValue: mockEventBus },
        { provide: 'IOutboxService', useValue: mockOutboxService },
        { provide: 'IUnitOfWork', useValue: mockUnitOfWork },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    handler = module.get<CreateCompanyHandler>(CreateCompanyHandler);
  });

  describe('Success Cases', () => {
    it('should create company with full data', async () => {
      // Arrange
      const command = new CreateCompanyCommand(
        'Tech Corp',
        'Leading technology company',
        'https://techcorp.com',
        'https://techcorp.com/logo.png',
        'Technology',
        '51-200',
        'San Francisco, CA',
        'HR Manager',
        'hr-user-id',
      );

      // Act
      const result = await handler.execute(command);

      // Assert - Returns company ID
      expect(result.companyId).toBe('mock-company-id');

      // Assert - UnitOfWork was called
      expect(mockUnitOfWork.execute).toHaveBeenCalledTimes(1);

      // Assert - Company saved within transaction
      expect(mockCompanyRepository.save).toHaveBeenCalledTimes(1);
      expect(mockCompanyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'mock-company-id',
          name: 'Tech Corp',
          createdBy: 'hr-user-id',
        }),
        {}, // tx context from UoW
      );

      // Assert - Outbox event saved within transaction with 4 args
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        COMPANY_EVENT_TYPES.CREATED,
        expect.objectContaining({
          companyId: 'mock-company-id',
          name: 'Tech Corp',
          createdBy: 'hr-user-id',
        }),
        'mock-company-id',
        {}, // tx context from UoW
      );

      // Assert - schedulePublishing called after UoW commit
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith(['mock-event-id']);

      // Assert - Domain events published via EventBus
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should create company with minimal data', async () => {
      // Arrange
      const command = new CreateCompanyCommand(
        'Startup Inc',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        'hr-user-id',
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.companyId).toBe('mock-company-id');
      expect(mockCompanyRepository.save).toHaveBeenCalledTimes(1);
      expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
        COMPANY_EVENT_TYPES.CREATED,
        expect.objectContaining({
          companyId: 'mock-company-id',
          name: 'Startup Inc',
          createdBy: 'hr-user-id',
        }),
        'mock-company-id',
        {}, // tx context
      );
      expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith(['mock-event-id']);
    });

    it('should include createdAt in outbox event payload', async () => {
      // Arrange
      const command = new CreateCompanyCommand(
        'Test Corp',
        null,
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

      // Assert - payload has createdAt
      const saveEventCall = mockOutboxService.saveEvent.mock.calls[0];
      const payload = saveEventCall[1];
      expect(payload.createdAt).toBeDefined();
      expect(typeof payload.createdAt).toBe('string');
    });
  });

  describe('Error Cases', () => {
    it('should throw when company name is empty', async () => {
      // Arrange
      const command = new CreateCompanyCommand(
        '', // empty name
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        'hr-user-id',
      );

      // Act & Assert - Domain validation throws
      await expect(handler.execute(command)).rejects.toThrow(
        'Company name cannot be empty',
      );

      // Assert - No saves attempted
      expect(mockUnitOfWork.execute).not.toHaveBeenCalled();
      expect(mockOutboxService.schedulePublishing).not.toHaveBeenCalled();
    });
  });

  describe('Transaction Behavior', () => {
    it('should execute company save and outbox save inside UoW', async () => {
      // Arrange
      const executionOrder: string[] = [];
      mockCompanyRepository.save.mockImplementation(async () => {
        executionOrder.push('company.save');
      });
      mockOutboxService.saveEvent.mockImplementation(async () => {
        executionOrder.push('outbox.saveEvent');
        return 'mock-event-id';
      });

      const command = new CreateCompanyCommand(
        'Test Corp',
        null,
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

      // Assert - Operations happen in order inside UoW
      expect(executionOrder).toEqual([
        'company.save',
        'outbox.saveEvent',
      ]);
    });

    it('should not call schedulePublishing if UoW fails', async () => {
      // Arrange
      mockUnitOfWork.execute.mockRejectedValue(new Error('Transaction failed'));

      const command = new CreateCompanyCommand(
        'Test Corp',
        null,
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
    });

    it('should not publish domain events if UoW fails', async () => {
      // Arrange
      mockUnitOfWork.execute.mockRejectedValue(new Error('Transaction failed'));

      const command = new CreateCompanyCommand(
        'Test Corp',
        null,
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
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});
