import { Producer, Consumer, KafkaMessage } from 'kafkajs';
export declare class KafkaService {
    private serviceName;
    private kafka;
    private producer;
    private consumers;
    constructor(serviceName: string, brokers?: string[]);
    createProducer(): Promise<Producer>;
    createConsumer(groupId: string): Promise<Consumer>;
    publishEvent(topic: string, event: any, additionalHeaders?: Record<string, Buffer | string>, options?: {
        partitionKey?: string;
    }): Promise<void>;
    subscribe(topic: string, groupId: string, handler: (message: KafkaMessage) => Promise<void>, options?: {
        fromBeginning?: boolean;
        autoCommit?: boolean;
        mode?: 'eachMessage' | 'eachBatch';
    }): Promise<void>;
    disconnect(): Promise<void>;
    sendToDLQ(originalTopic: string, message: KafkaMessage, error: Error, retryCount?: number): Promise<void>;
    parseEvent<T = any>(message: KafkaMessage): T | null;
}
