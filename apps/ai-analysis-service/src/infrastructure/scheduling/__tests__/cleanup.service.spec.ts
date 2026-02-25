import { CleanupService } from '../cleanup.service';
import { Repository, DeleteResult } from 'typeorm';
import { ProcessedEventEntity } from '../../persistence/entities/processed-event.entity';

describe('CleanupService', () => {
  let service: CleanupService;
  let mockRepository: jest.Mocked<Repository<ProcessedEventEntity>>;

  beforeEach(() => {
    mockRepository = {
      delete: jest.fn(),
    } as any;

    service = new CleanupService(mockRepository);
  });

  describe('cleanupProcessedEvents', () => {
    it('should delete processed events older than 30 days', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 15 } as DeleteResult);

      await service.cleanupProcessedEvents();

      expect(mockRepository.delete).toHaveBeenCalledTimes(1);
      const deleteArg = mockRepository.delete.mock.calls[0][0] as any;
      expect(deleteArg).toHaveProperty('processedAt');
    });

    it('should not throw when no events to delete', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 } as DeleteResult);

      await expect(service.cleanupProcessedEvents()).resolves.not.toThrow();
      expect(mockRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should catch and log errors without throwing', async () => {
      mockRepository.delete.mockRejectedValue(new Error('DB connection failed'));

      await expect(service.cleanupProcessedEvents()).resolves.not.toThrow();
    });
  });
});
