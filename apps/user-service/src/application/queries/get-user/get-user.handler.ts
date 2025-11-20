import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserQuery } from './get-user.query';
import type { IUserReadRepository } from '../../../domain/repositories/user-read.repository.interface';
import type { UserReadModel } from '../../../domain/read-models/user.read-model';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';

/**
 * Get User Query Handler
 * Returns Read Model (plain object) - no domain entity
 */
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUserQuery): Promise<UserReadModel> {
    const user = await this.userReadRepository.findById(query.userId);

    if (!user) {
      throw new UserNotFoundException(query.userId);
    }

    return user;
  }
}
