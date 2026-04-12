import {
  Kafka,
  Producer,
  Consumer,
  KafkaMessage,
  EachBatchPayload,
  logLevel,
} from "kafkajs";
import { KAFKA_CONFIG } from "../events";

function decodeHeaders(
  headers?: Record<string, Buffer | string | (string | Buffer)[] | undefined>,
): Record<string, string> {
  if (!headers) return {};
  const decoded: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (Buffer.isBuffer(value)) {
      decoded[key] = value.toString("utf-8");
    } else if (Array.isArray(value)) {
      decoded[key] = value
        .map((v) => (Buffer.isBuffer(v) ? v.toString("utf-8") : String(v)))
        .join(", ");
    } else {
      decoded[key] = String(value);
    }
  }
  return decoded;
}

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();

  constructor(
    private serviceName: string,
    brokers: string[] = KAFKA_CONFIG.brokers,
  ) {
    const envPrefix = process.env.NODE_ENV === "test" ? "test-" : "";
    this.kafka = new Kafka({
      clientId: `${envPrefix}${KAFKA_CONFIG.clientId}-${serviceName}`,
      brokers,
      logLevel: logLevel.ERROR,

      // ============ FIX: Connection Settings ============
      connectionTimeout: 10000, // 10 seconds (default: 1000ms)
      requestTimeout: 30000, // 30 seconds (default: 30000ms)

      // ============ FIX: Retry Settings ============
      retry: {
        initialRetryTime: 100, // 100ms (faster initial retry)
        retries: 5, // Reasonable retry count
        maxRetryTime: 30000, // Max 30 seconds between retries
      },
    });
  }

  async createProducer(): Promise<Producer> {
    if (!this.producer) {
      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        retry: {
          retries: 10, // Increase retries for idempotent producer (default is 5)
          initialRetryTime: 300,
          maxRetryTime: 30000,
        },
      });

      await this.producer.connect();
      console.log(`📤 Kafka Producer connected for ${this.serviceName}`);
    }
    return this.producer;
  }

  async createConsumer(
    groupId: string,
    options?: { sessionTimeout?: number },
  ): Promise<Consumer> {
    // Prefix with NODE_ENV to isolate test consumers from dev consumers
    const envPrefix = process.env.NODE_ENV === "test" ? "test-" : "";
    const fullGroupId = `${envPrefix}${groupId}-${this.serviceName}`;
    const consumerKey = fullGroupId;

    // Default 30s session timeout. Long-running consumers (AI analysis) can override.
    const sessionTimeout = options?.sessionTimeout ?? 30000;
    const heartbeatInterval = Math.min(sessionTimeout / 3, 10000);

    if (!this.consumers.has(consumerKey)) {
      const consumer = this.kafka.consumer({
        groupId: fullGroupId,
        sessionTimeout,
        heartbeatInterval,
        rebalanceTimeout: Math.min(sessionTimeout * 2, 120000),
        maxWaitTimeInMs: 5000, // 5s
        allowAutoTopicCreation: false,
      });

      await consumer.connect();
      this.consumers.set(consumerKey, consumer);
      console.log(`📥 Kafka Consumer connected: ${consumerKey}`);
    }

    return this.consumers.get(consumerKey)!;
  }

  async publishEvent(
    topic: string,
    event: any,
    additionalHeaders?: Record<string, Buffer | string>,
    options?: { partitionKey?: string },
  ): Promise<void> {
    const startTime = Date.now();
    try {
      const producer = await this.createProducer();

      // Use userId as partition key for user events to ensure ordering per user
      const partitionKey =
        options?.partitionKey ||
        event.payload?.userId ||
        event.eventId ||
        "default";

      // Merge default headers with additional headers (for tracing)
      const headers = {
        eventType: event.eventType,
        version: event.version?.toString() || "1",
        ...additionalHeaders, // Include trace context headers
      };

      await producer.send({
        topic,
        messages: [
          {
            key: partitionKey,
            value: JSON.stringify(event),
            headers,
          },
        ],
      });

      console.log(`📤 Event published to ${topic}: ${event.eventType}`);

      // Metrics would be added here if MetricsService was available
      // this.metricsService?.incrementKafkaProduced(topic, 'success');
    } catch (error) {
      console.error(`❌ Failed to publish event to ${topic}:`, error);
      // this.metricsService?.incrementKafkaProduced(topic, 'failure');
      throw error;
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      // this.metricsService?.observeKafkaProcessing(topic, duration);
    }
  }

  async subscribe(
    topic: string,
    groupId: string,
    handler: (message: KafkaMessage) => Promise<void>,
    options?: {
      fromBeginning?: boolean;
      autoCommit?: boolean;
      mode?: "eachMessage" | "eachBatch";
      sessionTimeout?: number;
    },
  ): Promise<void> {
    try {
      const consumer = await this.createConsumer(groupId, {
        sessionTimeout: options?.sessionTimeout,
      });
      const fromBeginning = options?.fromBeginning ?? true;
      const autoCommit = options?.autoCommit ?? true;
      const mode = options?.mode ?? "eachMessage";

      await consumer.subscribe({ topic, fromBeginning });

      if (mode === "eachBatch" || autoCommit === false) {
        await consumer.run({
          autoCommit: false,
          eachBatchAutoResolve: false,
          eachBatch: async (payload: EachBatchPayload) => {
            const {
              batch,
              resolveOffset,
              commitOffsetsIfNecessary,
              heartbeat,
              isRunning,
              isStale,
            } = payload;

            for (const message of batch.messages) {
              if (!isRunning() || isStale()) break;

              try {
                console.log(
                  `📥 Received message from ${batch.topic}:${batch.partition}`,
                  {
                    key: message.key?.toString(),
                    headers: decodeHeaders(message.headers),
                    offset: message.offset,
                  },
                );

                await handler(message);
                resolveOffset(message.offset);
                await heartbeat();
              } catch (error) {
                console.error(
                  `❌ Error processing message from ${batch.topic}:`,
                  error,
                );

                // Get retry count from headers or default to 0
                const retryCount = parseInt(
                  message.headers?.["retry-count"]?.toString() || "0",
                );
                const maxRetries = 3;

                if (retryCount >= maxRetries) {
                  // Max retries reached, send to DLQ and resolve offset
                  console.log(
                    `💀 Max retries reached, sending to DLQ: ${batch.topic}`,
                  );
                  await this.sendToDLQ(
                    batch.topic,
                    message,
                    error as Error,
                    retryCount,
                  );
                  resolveOffset(message.offset);
                } else {
                  // Don't resolve offset, message will be retried
                  console.log(
                    `🔄 Retry ${retryCount + 1}/${maxRetries} for message from ${batch.topic}`,
                  );
                  throw error;
                }

                await heartbeat();
              }
            }

            await commitOffsetsIfNecessary();
          },
        });
      } else {
        await consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            try {
              console.log(`📥 Received message from ${topic}:${partition}`, {
                key: message.key?.toString(),
                headers: decodeHeaders(message.headers),
              });

              await handler(message);
            } catch (error) {
              console.error(
                `❌ Error processing message from ${topic}:`,
                error,
              );
            }
          },
        });
      }

      console.log(
        `🔄 Subscribed to topic: ${topic} (group: ${groupId}) [mode=${mode}, autoCommit=${autoCommit}, fromBeginning=${fromBeginning}]`,
      );
    } catch (error) {
      console.error(`❌ Failed to subscribe to ${topic}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        this.producer = null;
      }

      for (const [key, consumer] of this.consumers) {
        await consumer.disconnect();
        console.log(`📥 Consumer disconnected: ${key}`);
      }
      this.consumers.clear();

      console.log(`🔌 Kafka service disconnected for ${this.serviceName}`);
    } catch (error) {
      console.error("❌ Error disconnecting Kafka:", error);
    }
  }

  // Utility method to parse event from Kafka message
  async sendToDLQ(
    originalTopic: string,
    message: KafkaMessage,
    error: Error,
    retryCount: number = 0,
  ): Promise<void> {
    try {
      const dlqTopic = `${originalTopic}-dlq`;
      const producer = await this.createProducer();

      const dlqMessage = {
        originalTopic,
        originalMessage: message.value?.toString(),
        originalKey: message.key?.toString(),
        originalHeaders: decodeHeaders(message.headers),
        originalOffset: message.offset,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        retryCount,
        failedAt: Date.now(),
        serviceName: this.serviceName,
      };

      await producer.send({
        topic: dlqTopic,
        messages: [
          {
            key: message.key,
            value: JSON.stringify(dlqMessage),
            headers: {
              ...message.headers,
              "dlq-original-topic": String(originalTopic),
              "dlq-failed-at": String(Date.now()),
              "dlq-retry-count": String(retryCount),
              "dlq-service": String(this.serviceName),
            },
          },
        ],
      });

      console.log(
        `💀 Message sent to DLQ: ${originalTopic} → ${dlqTopic} (retry: ${retryCount})`,
      );
    } catch (dlqError) {
      console.error("❌ Failed to send message to DLQ:", dlqError);
    }
  }

  parseEvent<T = any>(message: KafkaMessage): T | null {
    try {
      if (!message.value) return null;
      return JSON.parse(message.value.toString()) as T;
    } catch (error) {
      console.error("❌ Failed to parse Kafka message:", error);
      return null;
    }
  }
}
