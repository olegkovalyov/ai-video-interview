import { Command } from '@nestjs/cqrs';
import type { User } from '../../../domain/aggregates/user.aggregate';

export class UploadAvatarCommand extends Command<User> {
  constructor(
    public readonly userId: string,
    public readonly file: Express.Multer.File,
  ) {
    super();
  }
}
