export interface KafkaHealthStatus {
    isHealthy: boolean;
    brokers: string[];
    topics: string[];
    consumerGroups: ConsumerGroupInfo[];
    error?: string;
    timestamp: number;
}
export interface ConsumerGroupInfo {
    groupId: string;
    state: string;
    members: number;
    lag: ConsumerLag[];
}
export interface ConsumerLag {
    topic: string;
    partition: number;
    currentOffset: string;
    highWatermark: string;
    lag: number;
}
export declare class KafkaHealthService {
    private kafka;
    private admin;
    constructor(brokers?: string[]);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    checkHealth(): Promise<KafkaHealthStatus>;
    private getBrokers;
    private getTopics;
    private getConsumerGroups;
    private getConsumerLag;
    private getHighWatermark;
    getConsumerGroupLag(groupId: string): Promise<ConsumerLag[]>;
    resetConsumerGroup(groupId: string, topic?: string): Promise<void>;
}
