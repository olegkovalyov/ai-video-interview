import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RealtimeService } from "./realtime.service";
import { MetricsModule } from "../metrics/metrics.module";

@Module({
  imports: [ConfigModule, MetricsModule],
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
