import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserQuery } from './get-user.query';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserReadRepository } from '../../../domain/repositories/user-read.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';

/**
 * Get User Query Handler
 * Retrieves user from read repository
 */
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUserQuery): Promise<User> {
    const user = await this.userReadRepository.findById(query.userId);

    if (!user) {
      throw new UserNotFoundException(query.userId);
    }

    return user;
  }
}
