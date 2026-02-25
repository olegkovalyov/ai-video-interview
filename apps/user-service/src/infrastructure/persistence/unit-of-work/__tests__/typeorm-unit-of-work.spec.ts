import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { TypeOrmUnitOfWork } from '../typeorm-unit-of-work';
import type { ITransactionContext } from '../../../../application/interfaces/transaction-context.interface';

describe('TypeOrmUnitOfWork', () => {
  let unitOfWork: TypeOrmUnitOfWork;

  const mockEntityManager = {
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest
      .fn()
      .mockImplementation(async (work: Function) => work(mockEntityManager)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmUnitOfWork,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    unitOfWork = module.get<TypeOrmUnitOfWork>(TypeOrmUnitOfWork);
  });

  describe('execute', () => {
    it('should call DataSource.transaction()', async () => {
      await unitOfWork.execute(async () => 'result');

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockDataSource.transaction).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('should commit transaction on success and return the result', async () => {
      const expectedResult = { id: 'user-1', name: 'Test User' };

      const result = await unitOfWork.execute(async () => expectedResult);

      expect(result).toEqual(expectedResult);
    });

    it('should return primitive values from work function', async () => {
      const result = await unitOfWork.execute(async () => 'event-id-123');

      expect(result).toBe('event-id-123');
    });

    it('should return void/undefined from work function', async () => {
      const result = await unitOfWork.execute(async () => undefined);

      expect(result).toBeUndefined();
    });

    it('should pass transaction context (EntityManager) to work function', async () => {
      let receivedContext: ITransactionContext | null = null;

      await unitOfWork.execute(async (tx) => {
        receivedContext = tx;
        return 'done';
      });

      // The EntityManager is cast to ITransactionContext
      expect(receivedContext).toBe(mockEntityManager);
    });

    it('should rollback transaction on error and re-throw', async () => {
      const error = new Error('Something went wrong');

      await expect(
        unitOfWork.execute(async () => {
          throw error;
        }),
      ).rejects.toThrow('Something went wrong');

      // DataSource.transaction() handles rollback internally when callback throws
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('should propagate domain exceptions from work function', async () => {
      class UserAlreadyExistsException extends Error {
        constructor(email: string) {
          super(`User with email ${email} already exists`);
          this.name = 'UserAlreadyExistsException';
        }
      }

      await expect(
        unitOfWork.execute(async () => {
          throw new UserAlreadyExistsException('test@example.com');
        }),
      ).rejects.toThrow('User with email test@example.com already exists');
    });

    it('should allow work function to use the transaction context for operations', async () => {
      const mockEntity = { id: '1', name: 'test' };
      mockEntityManager.save.mockResolvedValue(mockEntity);

      const result = await unitOfWork.execute(async (tx) => {
        const manager = tx as unknown as typeof mockEntityManager;
        return manager.save(mockEntity);
      });

      expect(result).toEqual(mockEntity);
      expect(mockEntityManager.save).toHaveBeenCalledWith(mockEntity);
    });

    it('should handle multiple sequential executions independently', async () => {
      const result1 = await unitOfWork.execute(async () => 'first');
      const result2 = await unitOfWork.execute(async () => 'second');

      expect(result1).toBe('first');
      expect(result2).toBe('second');
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(2);
    });

    it('should handle async operations inside work function', async () => {
      const result = await unitOfWork.execute(async (tx) => {
        const manager = tx as unknown as typeof mockEntityManager;
        manager.save.mockResolvedValueOnce({ id: '1' });
        manager.save.mockResolvedValueOnce({ id: '2' });

        const saved1 = await manager.save({ name: 'entity1' });
        const saved2 = await manager.save({ name: 'entity2' });

        return [saved1.id, saved2.id];
      });

      expect(result).toEqual(['1', '2']);
      expect(mockEntityManager.save).toHaveBeenCalledTimes(2);
    });
  });
});
