import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserByExternalAuthIdQuery } from './get-user-by-external-auth-id.query';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserReadRepository } from '../../../domain/repositories/user-read.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';

/**
 * Get User By External Auth ID Query Handler
 */
@QueryHandler(GetUserByExternalAuthIdQuery)
export class GetUserByExternalAuthIdHandler implements IQueryHandler<GetUserByExternalAuthIdQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUserByExternalAuthIdQuery): Promise<User> {
    const user = await this.userReadRepository.findByExternalAuthId(query.externalAuthId);

    if (!user) {
      throw new UserNotFoundException(query.externalAuthId);
    }

    return user;
  }
}
