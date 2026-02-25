"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaHealthService = void 0;
const kafkajs_1 = require("kafkajs");
const events_1 = require("../events");
class KafkaHealthService {
    kafka;
    admin;
    constructor(brokers = events_1.KAFKA_CONFIG.brokers) {
        this.kafka = new kafkajs_1.Kafka({
            clientId: `${events_1.KAFKA_CONFIG.clientId}-health`,
            brokers,
            retry: {
                initialRetryTime: 100,
                retries: 3,
            },
        });
        this.admin = this.kafka.admin();
    }
    async connect() {
        await this.admin.connect();
        console.log('🏥 Kafka Health Service connected');
    }
    async disconnect() {
        await this.admin.disconnect();
        console.log('🏥 Kafka Health Service disconnected');
    }
    async checkHealth() {
        try {
            const [brokers, topics, consumerGroups] = await Promise.all([
                this.getBrokers(),
                this.getTopics(),
                this.getConsumerGroups(),
            ]);
            return {
                isHealthy: true,
                brokers,
                topics,
                consumerGroups,
                timestamp: Date.now(),
            };
        }
        catch (error) {
            console.error('❌ Kafka health check failed:', error);
            return {
                isHealthy: false,
                brokers: [],
                topics: [],
                consumerGroups: [],
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now(),
            };
        }
    }
    async getBrokers() {
        try {
            await this.admin.listTopics();
            return events_1.KAFKA_CONFIG.brokers;
        }
        catch (error) {
            throw new Error(`Failed to connect to Kafka brokers: ${error}`);
        }
    }
    async getTopics() {
        return await this.admin.listTopics();
    }
    async getConsumerGroups() {
        try {
            const groups = await this.admin.listGroups();
            const groupInfos = [];
            for (const group of groups.groups) {
                const groupDescription = await this.admin.describeGroups([group.groupId]);
                const groupInfo = groupDescription.groups[0];
                if (groupInfo) {
                    const lag = await this.getConsumerLag(group.groupId);
                    groupInfos.push({
                        groupId: group.groupId,
                        state: groupInfo.state,
                        members: groupInfo.members.length,
                        lag,
                    });
                }
            }
            return groupInfos;
        }
        catch (error) {
            console.error('❌ Error fetching consumer groups:', error);
            return [];
        }
    }
    async getConsumerLag(groupId) {
        try {
            const offsets = await this.admin.fetchOffsets({
                groupId,
                topics: await this.getTopics(),
            });
            const lagInfo = [];
            for (const topicOffset of offsets) {
                for (const partitionOffset of topicOffset.partitions) {
                    const highWatermark = await this.getHighWatermark(topicOffset.topic, partitionOffset.partition);
                    const currentOffset = parseInt(partitionOffset.offset);
                    const hwm = parseInt(highWatermark);
                    const lag = Math.max(0, hwm - currentOffset);
                    lagInfo.push({
                        topic: topicOffset.topic,
                        partition: partitionOffset.partition,
                        currentOffset: partitionOffset.offset,
                        highWatermark,
                        lag,
                    });
                }
            }
            return lagInfo;
        }
        catch (error) {
            console.error(`❌ Error fetching consumer lag for group ${groupId}:`, error);
            return [];
        }
    }
    async getHighWatermark(topic, partition) {
        try {
            const metadata = await this.admin.fetchTopicMetadata({ topics: [topic] });
            const topicMetadata = metadata.topics[0];
            if (topicMetadata) {
                return '0';
            }
            return '0';
        }
        catch (error) {
            return '0';
        }
    }
    async getConsumerGroupLag(groupId) {
        return await this.getConsumerLag(groupId);
    }
    async resetConsumerGroup(groupId, topic) {
        try {
            if (topic) {
                await this.admin.resetOffsets({
                    groupId,
                    topic,
                    earliest: true,
                });
            }
            else {
                const topics = await this.getTopics();
                for (const topicName of topics) {
                    try {
                        await this.admin.resetOffsets({
                            groupId,
                            topic: topicName,
                            earliest: true,
                        });
                    }
                    catch (error) {
                    }
                }
            }
            console.log(`✅ Consumer group ${groupId} offsets reset`);
        }
        catch (error) {
            console.error(`❌ Error resetting consumer group ${groupId}:`, error);
            throw error;
        }
    }
}
exports.KafkaHealthService = KafkaHealthService;
//# sourceMappingURL=kafka-health.service.js.map