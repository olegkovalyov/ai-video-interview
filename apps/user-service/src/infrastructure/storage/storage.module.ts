import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MinioStorageService } from './minio-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'IStorageService',
      useClass: MinioStorageService,
    },
  ],
  exports: ['IStorageService'],
})
export class StorageModule {}
