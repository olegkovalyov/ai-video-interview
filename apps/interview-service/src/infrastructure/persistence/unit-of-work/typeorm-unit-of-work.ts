import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { IUnitOfWork } from '../../../application/interfaces/unit-of-work.interface';
import type { ITransactionContext } from '../../../application/interfaces/transaction-context.interface';
import { LoggerService } from '../../logger/logger.service';

/**
 * TypeORM UnitOfWork Implementation
 *
 * Wraps all operations inside a single PostgreSQL transaction.
 * The EntityManager from TypeORM is cast to ITransactionContext (opaque marker)
 * so that application/domain layers remain free of TypeORM dependencies.
 *
 * Usage:
 *   await unitOfWork.execute(async (tx) => {
 *     await templateRepo.save(template, tx);
 *     await outboxService.saveEvent(..., tx);
 *   });
 */
@Injectable()
export class TypeOrmUnitOfWork implements IUnitOfWork {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService,
  ) {}

  async execute<T>(work: (tx: ITransactionContext) => Promise<T>): Promise<T> {
    this.logger.debug('Starting transaction');

    try {
      const result = await this.dataSource.transaction(async (manager) => {
        return work(manager as unknown as ITransactionContext);
      });

      this.logger.debug('Transaction committed');
      return result;
    } catch (error) {
      this.logger.warn(`Transaction rolled back: ${error.message}`);
      throw error;
    }
  }
}
