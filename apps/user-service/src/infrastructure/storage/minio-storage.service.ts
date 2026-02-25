import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { IStorageService } from '../../application/commands/upload-avatar/upload-avatar.handler';

/**
 * MinIO Storage Service Implementation
 * Handles avatar file uploads to MinIO (S3-compatible)
 */
@Injectable()
export class MinioStorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(MinioStorageService.name);
  private minioClient: Minio.Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get('MINIO_BUCKET', 'user-avatars');

    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get('MINIO_PORT', '9000'), 10),
      useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  /**
   * Upload file to MinIO
   * Returns public URL of uploaded file
   */
  async uploadFile(file: any, bucket?: string): Promise<string> {
    const targetBucket = bucket || this.bucket;
    
    try {
      // Generate unique filename
      const filename = this.generateFilename(file.originalname);
      const filepath = `avatars/${filename}`;

      // Upload to MinIO
      await this.minioClient.putObject(
        targetBucket,
        filepath,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'x-amz-acl': 'public-read',
        },
      );

      // Generate public URL
      const url = this.getPublicUrl(targetBucket, filepath);
      
      this.logger.log(`✅ Uploaded file: ${filepath} (${file.size} bytes)`);
      
      return url;
    } catch (error) {
      this.logger.error(
        `❌ Failed to upload file: ${error.message}`,
        error.stack,
      );
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from MinIO by URL
   */
  async deleteFile(url: string): Promise<void> {
    try {
      const { bucket, filepath } = this.parseUrl(url);
      
      await this.minioClient.removeObject(bucket, filepath);
      
      this.logger.log(`🗑️ Deleted file: ${filepath}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to delete file: ${error.message}`,
        error.stack,
      );
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Get presigned URL for private file access
   */
  async getPresignedUrl(
    bucket: string,
    filepath: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        bucket,
        filepath,
        expirySeconds,
      );
      
      return url;
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate presigned URL: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(bucket: string, filepath: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(bucket, filepath);
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Ensure bucket exists, create if not
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket, 'us-east-1');
        
        // Set public read policy
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };
        
        await this.minioClient.setBucketPolicy(
          this.bucket,
          JSON.stringify(policy),
        );
        
        this.logger.log(`✅ Created bucket: ${this.bucket}`);
      } else {
        this.logger.log(`✅ Bucket exists: ${this.bucket}`);
      }
    } catch (error) {
      this.logger.warn(
        `MinIO bucket check skipped (service may be unavailable): ${error.message}`,
      );
    }
  }

  /**
   * Generate unique filename
   */
  private generateFilename(originalname: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = originalname.split('.').pop();
    
    return `${timestamp}-${random}.${ext}`;
  }

  /**
   * Get public URL for uploaded file
   */
  private getPublicUrl(bucket: string, filepath: string): string {
    const endpoint = this.configService.get('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get('MINIO_PORT', '9000');
    const useSSL = this.configService.get('MINIO_USE_SSL', 'false') === 'true';
    
    const protocol = useSSL ? 'https' : 'http';
    const portSuffix = (useSSL && port === '443') || (!useSSL && port === '80') ? '' : `:${port}`;
    
    return `${protocol}://${endpoint}${portSuffix}/${bucket}/${filepath}`;
  }

  /**
   * Parse URL to extract bucket and filepath
   */
  private parseUrl(url: string): { bucket: string; filepath: string } {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.substring(1).split('/');
      const bucket = parts[0];
      const filepath = parts.slice(1).join('/');
      
      return { bucket, filepath };
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}`);
    }
  }
}
