import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserByKeycloakIdQuery } from './get-user-by-keycloak-id.query';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserReadRepository } from '../../../domain/repositories/user-read.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';

/**
 * Get User By Keycloak ID Query Handler
 */
@QueryHandler(GetUserByKeycloakIdQuery)
export class GetUserByKeycloakIdHandler implements IQueryHandler<GetUserByKeycloakIdQuery> {
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetUserByKeycloakIdQuery): Promise<User> {
    const user = await this.userReadRepository.findByKeycloakId(query.keycloakId);

    if (!user) {
      throw new UserNotFoundException(query.keycloakId);
    }

    return user;
  }
}
