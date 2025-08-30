import { Kafka, Producer, Consumer, KafkaMessage } from 'kafkajs';
import { KAFKA_CONFIG } from '../events';

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();

  constructor(
    private serviceName: string,
    brokers: string[] = KAFKA_CONFIG.brokers
  ) {
    this.kafka = new Kafka({
      clientId: `${KAFKA_CONFIG.clientId}-${serviceName}`,
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }

  async createProducer(): Promise<Producer> {
    if (!this.producer) {
      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
      });
      
      await this.producer.connect();
      console.log(`📤 Kafka Producer connected for ${this.serviceName}`);
    }
    return this.producer;
  }

  async createConsumer(groupId: string): Promise<Consumer> {
    const consumerKey = `${groupId}-${this.serviceName}`;
    
    if (!this.consumers.has(consumerKey)) {
      const consumer = this.kafka.consumer({
        groupId: `${groupId}-${this.serviceName}`,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });
      
      await consumer.connect();
      this.consumers.set(consumerKey, consumer);
      console.log(`📥 Kafka Consumer connected: ${consumerKey}`);
    }
    
    return this.consumers.get(consumerKey)!;
  }

  async publishEvent(topic: string, event: any): Promise<void> {
    try {
      const producer = await this.createProducer();
      
      await producer.send({
        topic,
        messages: [{
          key: event.eventId || crypto.randomUUID(),
          value: JSON.stringify(event),
          timestamp: event.timestamp || new Date().toISOString(),
          headers: {
            eventType: event.eventType,
            source: event.source || this.serviceName,
            version: event.version || '1.0',
          },
        }],
      });
      
      console.log(`📤 Event published: ${event.eventType} → ${topic}`);
    } catch (error) {
      console.error(`❌ Failed to publish event to ${topic}:`, error);
      throw error;
    }
  }

  async subscribe(
    topic: string,
    groupId: string,
    handler: (message: KafkaMessage) => Promise<void>
  ): Promise<void> {
    try {
      const consumer = await this.createConsumer(groupId);
      
      await consumer.subscribe({ topic, fromBeginning: true });
      
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            console.log(`📥 Received message from ${topic}:${partition}`, {
              key: message.key?.toString(),
              headers: message.headers,
            });
            
            await handler(message);
          } catch (error) {
            console.error(`❌ Error processing message from ${topic}:`, error);
            // In production, you might want to send to dead letter queue
          }
        },
      });
      
      console.log(`🔄 Subscribed to topic: ${topic} (group: ${groupId})`);
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
      console.error('❌ Error disconnecting Kafka:', error);
    }
  }

  // Utility method to parse event from Kafka message
  parseEvent<T = any>(message: KafkaMessage): T | null {
    try {
      if (!message.value) return null;
      return JSON.parse(message.value.toString()) as T;
    } catch (error) {
      console.error('❌ Failed to parse Kafka message:', error);
      return null;
    }
  }
}
