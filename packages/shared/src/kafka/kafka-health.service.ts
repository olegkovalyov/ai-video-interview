import { Kafka, Admin } from 'kafkajs';
import { KAFKA_CONFIG } from '../events';

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

export class KafkaHealthService {
  private kafka: Kafka;
  private admin: Admin;

  constructor(brokers: string[] = KAFKA_CONFIG.brokers) {
    this.kafka = new Kafka({
      clientId: `${KAFKA_CONFIG.clientId}-health`,
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 3,
      },
    });
    this.admin = this.kafka.admin();
  }

  async connect(): Promise<void> {
    await this.admin.connect();
    console.log('🏥 Kafka Health Service connected');
  }

  async disconnect(): Promise<void> {
    await this.admin.disconnect();
    console.log('🏥 Kafka Health Service disconnected');
  }

  async checkHealth(): Promise<KafkaHealthStatus> {
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
    } catch (error) {
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

  private async getBrokers(): Promise<string[]> {
    try {
      // Use listTopics to test connectivity, as fetchMetadata might not be available
      await this.admin.listTopics();
      // Return configured brokers since we can't easily get runtime broker info
      return KAFKA_CONFIG.brokers;
    } catch (error) {
      throw new Error(`Failed to connect to Kafka brokers: ${error}`);
    }
  }

  private async getTopics(): Promise<string[]> {
    return await this.admin.listTopics();
  }

  private async getConsumerGroups(): Promise<ConsumerGroupInfo[]> {
    try {
      const groups = await this.admin.listGroups();
      const groupInfos: ConsumerGroupInfo[] = [];

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
    } catch (error) {
      console.error('❌ Error fetching consumer groups:', error);
      return [];
    }
  }

  private async getConsumerLag(groupId: string): Promise<ConsumerLag[]> {
    try {
      const offsets = await this.admin.fetchOffsets({
        groupId,
        topics: await this.getTopics(),
      });

      const lagInfo: ConsumerLag[] = [];

      for (const topicOffset of offsets) {
        for (const partitionOffset of topicOffset.partitions) {
          const highWatermark = await this.getHighWatermark(
            topicOffset.topic,
            partitionOffset.partition
          );

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
    } catch (error) {
      console.error(`❌ Error fetching consumer lag for group ${groupId}:`, error);
      return [];
    }
  }

  private async getHighWatermark(topic: string, partition: number): Promise<string> {
    try {
      const metadata = await this.admin.fetchTopicMetadata({ topics: [topic] });
      const topicMetadata = metadata.topics[0];
      
      if (topicMetadata) {
        // This is a simplified approach - in production you'd use consumer API
        // to get actual high watermarks
        return '0'; // Placeholder - actual implementation would fetch real HWM
      }
      
      return '0';
    } catch (error) {
      return '0';
    }
  }

  async getConsumerGroupLag(groupId: string): Promise<ConsumerLag[]> {
    return await this.getConsumerLag(groupId);
  }

  async resetConsumerGroup(groupId: string, topic?: string): Promise<void> {
    try {
      if (topic) {
        await this.admin.resetOffsets({
          groupId,
          topic,
          earliest: true,
        });
      } else {
        // Reset all topics for the group
        const topics = await this.getTopics();
        for (const topicName of topics) {
          try {
            await this.admin.resetOffsets({
              groupId,
              topic: topicName,
              earliest: true,
            });
          } catch (error) {
            // Topic might not have offsets for this group - continue
          }
        }
      }
      
      console.log(`✅ Consumer group ${groupId} offsets reset`);
    } catch (error) {
      console.error(`❌ Error resetting consumer group ${groupId}:`, error);
      throw error;
    }
  }
}
