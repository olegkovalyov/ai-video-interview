/**
 * Upload Avatar Command
 * Represents the intent to upload user avatar
 */
export class UploadAvatarCommand {
  constructor(
    public readonly userId: string,
    public readonly file: any, // Multer.File type
  ) {}
}
