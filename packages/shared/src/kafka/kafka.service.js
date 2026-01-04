"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaService = void 0;
const kafkajs_1 = require("kafkajs");
const events_1 = require("../events");
class KafkaService {
    serviceName;
    kafka;
    producer = null;
    consumers = new Map();
    constructor(serviceName, brokers = events_1.KAFKA_CONFIG.brokers) {
        this.serviceName = serviceName;
        this.kafka = new kafkajs_1.Kafka({
            clientId: `${events_1.KAFKA_CONFIG.clientId}-${serviceName}`,
            brokers,
            logLevel: kafkajs_1.logLevel.ERROR,
            connectionTimeout: 10000,
            requestTimeout: 30000,
            retry: {
                initialRetryTime: 100,
                retries: 5,
                maxRetryTime: 30000,
            },
        });
    }
    async createProducer() {
        if (!this.producer) {
            this.producer = this.kafka.producer({
                maxInFlightRequests: 1,
                idempotent: true,
                retry: {
                    retries: 10,
                    initialRetryTime: 300,
                    maxRetryTime: 30000,
                },
            });
            await this.producer.connect();
            console.log(`📤 Kafka Producer connected for ${this.serviceName}`);
        }
        return this.producer;
    }
    async createConsumer(groupId) {
        const consumerKey = `${groupId}-${this.serviceName}`;
        if (!this.consumers.has(consumerKey)) {
            const consumer = this.kafka.consumer({
                groupId: `${groupId}-${this.serviceName}`,
                sessionTimeout: 30000,
                heartbeatInterval: 3000,
                rebalanceTimeout: 60000,
                maxWaitTimeInMs: 5000,
                allowAutoTopicCreation: false,
            });
            await consumer.connect();
            this.consumers.set(consumerKey, consumer);
            console.log(`📥 Kafka Consumer connected: ${consumerKey}`);
        }
        return this.consumers.get(consumerKey);
    }
    async publishEvent(topic, event, additionalHeaders, options) {
        const startTime = Date.now();
        try {
            const producer = await this.createProducer();
            const partitionKey = options?.partitionKey ||
                event.payload?.userId ||
                event.eventId ||
                'default';
            const headers = {
                eventType: event.eventType,
                version: event.version?.toString() || '1',
                ...additionalHeaders,
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
        }
        catch (error) {
            console.error(`❌ Failed to publish event to ${topic}:`, error);
            throw error;
        }
        finally {
            const duration = (Date.now() - startTime) / 1000;
        }
    }
    async subscribe(topic, groupId, handler, options) {
        try {
            const consumer = await this.createConsumer(groupId);
            const fromBeginning = options?.fromBeginning ?? true;
            const autoCommit = options?.autoCommit ?? true;
            const mode = options?.mode ?? 'eachMessage';
            await consumer.subscribe({ topic, fromBeginning });
            if (mode === 'eachBatch' || autoCommit === false) {
                await consumer.run({
                    autoCommit: false,
                    eachBatchAutoResolve: false,
                    eachBatch: async (payload) => {
                        const { batch, resolveOffset, commitOffsetsIfNecessary, heartbeat, isRunning, isStale } = payload;
                        for (const message of batch.messages) {
                            if (!isRunning() || isStale())
                                break;
                            try {
                                console.log(`📥 Received message from ${batch.topic}:${batch.partition}`, {
                                    key: message.key?.toString(),
                                    headers: message.headers,
                                    offset: message.offset,
                                });
                                await handler(message);
                                resolveOffset(message.offset);
                                await heartbeat();
                            }
                            catch (error) {
                                console.error(`❌ Error processing message from ${batch.topic}:`, error);
                                const retryCount = parseInt(message.headers?.['retry-count']?.toString() || '0');
                                const maxRetries = 3;
                                if (retryCount >= maxRetries) {
                                    console.log(`💀 Max retries reached, sending to DLQ: ${batch.topic}`);
                                    await this.sendToDLQ(batch.topic, message, error, retryCount);
                                    resolveOffset(message.offset);
                                }
                                else {
                                    console.log(`🔄 Retry ${retryCount + 1}/${maxRetries} for message from ${batch.topic}`);
                                    throw error;
                                }
                                await heartbeat();
                            }
                        }
                        await commitOffsetsIfNecessary();
                    },
                });
            }
            else {
                await consumer.run({
                    eachMessage: async ({ topic, partition, message }) => {
                        try {
                            console.log(`📥 Received message from ${topic}:${partition}`, {
                                key: message.key?.toString(),
                                headers: message.headers,
                            });
                            await handler(message);
                        }
                        catch (error) {
                            console.error(`❌ Error processing message from ${topic}:`, error);
                        }
                    },
                });
            }
            console.log(`🔄 Subscribed to topic: ${topic} (group: ${groupId}) [mode=${mode}, autoCommit=${autoCommit}, fromBeginning=${fromBeginning}]`);
        }
        catch (error) {
            console.error(`❌ Failed to subscribe to ${topic}:`, error);
            throw error;
        }
    }
    async disconnect() {
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
        }
        catch (error) {
            console.error('❌ Error disconnecting Kafka:', error);
        }
    }
    async sendToDLQ(originalTopic, message, error, retryCount = 0) {
        try {
            const dlqTopic = `${originalTopic}-dlq`;
            const producer = await this.createProducer();
            const dlqMessage = {
                originalTopic,
                originalMessage: message.value?.toString(),
                originalKey: message.key?.toString(),
                originalHeaders: message.headers,
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
                messages: [{
                        key: message.key,
                        value: JSON.stringify(dlqMessage),
                        headers: {
                            ...message.headers,
                            'dlq-original-topic': String(originalTopic),
                            'dlq-failed-at': String(Date.now()),
                            'dlq-retry-count': String(retryCount),
                            'dlq-service': String(this.serviceName),
                        },
                    }],
            });
            console.log(`💀 Message sent to DLQ: ${originalTopic} → ${dlqTopic} (retry: ${retryCount})`);
        }
        catch (dlqError) {
            console.error('❌ Failed to send message to DLQ:', dlqError);
        }
    }
    parseEvent(message) {
        try {
            if (!message.value)
                return null;
            return JSON.parse(message.value.toString());
        }
        catch (error) {
            console.error('❌ Failed to parse Kafka message:', error);
            return null;
        }
    }
}
exports.KafkaService = KafkaService;
//# sourceMappingURL=kafka.service.js.map