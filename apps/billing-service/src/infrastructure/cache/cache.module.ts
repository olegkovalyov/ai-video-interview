import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { QuotaCacheService } from "./quota-cache.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [QuotaCacheService],
  exports: [QuotaCacheService],
})
export class CacheModule {}
