import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UploadAvatarCommand } from './upload-avatar.command';
import { User } from '../../../domain/aggregates/user.aggregate';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

/**
 * Storage Service Interface (will be implemented in infrastructure)
 */
export interface IStorageService {
  uploadFile(file: Express.Multer.File, bucket: string): Promise<string>;
  deleteFile(url: string): Promise<void>;
}

/**
 * Upload Avatar Command Handler
 */
@CommandHandler(UploadAvatarCommand)
export class UploadAvatarHandler implements ICommandHandler<UploadAvatarCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
    private readonly eventBus: EventBus,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: UploadAvatarCommand): Promise<User> {
    // 1. Load user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Upload file to storage (MinIO/S3)
    const avatarUrl = await this.storageService.uploadFile(
      command.file,
      'user-avatars',
    );

    // 3. Delete old avatar if exists
    if (user.avatarUrl) {
      try {
        await this.storageService.deleteFile(user.avatarUrl);
      } catch (error) {
        this.logger.error('Failed to delete old avatar', {
          userId: command.userId,
          oldAvatarUrl: user.avatarUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // 4. Update user
    user.uploadAvatar(avatarUrl);

    // 5. Save
    await this.userRepository.save(user);

    // 6. Publish events
    user.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    user.clearEvents();

    return user;
  }
}
