import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserByExternalAuthIdQuery } from './get-user-by-external-auth-id.query';
import type { IUserReadRepository } from '../../../domain/repositories/user-read.repository.interface';
import type { UserReadModel } from '../../../domain/read-models/user.read-model';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';

/**
 * Get User By External Auth ID Query Handler
 * Returns Read Model (plain object) - no domain entity
 */
@QueryHandler(GetUserByExternalAuthIdQuery)
export class GetUserByExternalAuthIdHandler implements IQueryHandler<GetUserByExternalAuthIdQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUserByExternalAuthIdQuery): Promise<UserReadModel> {
    const user = await this.userReadRepository.findByExternalAuthId(query.externalAuthId);

    if (!user) {
      throw new UserNotFoundException(query.externalAuthId);
    }

    return user;
  }
}
