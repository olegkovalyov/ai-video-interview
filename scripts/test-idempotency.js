#!/usr/bin/env node

const { KafkaService } = require('../packages/shared/dist');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

/**
 * Test script for Event Idempotency functionality
 * Tests: EventIdempotencyService, duplicate event prevention, processed_events table
 */
class EventIdempotencyService {
  constructor(dbPool) {
    this.dbPool = dbPool;
  }

  async isEventProcessed(eventId, serviceName) {
    try {
      const query = `
        SELECT 1 FROM processed_events 
        WHERE event_id = $1 AND service_name = $2 
        LIMIT 1
      `;
      const result = await this.dbPool.query(query, [eventId, serviceName]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Error checking event idempotency:', error);
      return false;
    }
  }

  async markEventProcessed(eventId, eventType, serviceName, payload = null) {
    const crypto = require('crypto');
    const payloadHash = payload ? crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex') : null;
    
    try {
      const query = `
        INSERT INTO processed_events (event_id, event_type, service_name, payload_hash)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (event_id, service_name) DO NOTHING
        RETURNING id
      `;
      const result = await this.dbPool.query(query, [eventId, eventType, serviceName, payloadHash]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Event marked as processed: ${eventId} (${eventType}) by ${serviceName}`);
        return true;
      } else {
        console.log(`⚡ Event already processed: ${eventId} (${eventType}) by ${serviceName}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error marking event as processed:', error);
      throw error;
    }
  }

  async processEventSafely(eventId, eventType, serviceName, payload, handler) {
    // Check if already processed
    const alreadyProcessed = await this.isEventProcessed(eventId, serviceName);
    if (alreadyProcessed) {
      console.log(`⏭️ Skipping already processed event: ${eventId}`);
      return false;
    }

    // Process the event
    await handler(payload);

    // Mark as processed only after successful processing
    await this.markEventProcessed(eventId, eventType, serviceName, payload);
    return true;
  }
}

async function testIdempotency() {
  console.log('🔄 Starting Event Idempotency Test...\n');

  // Database connection
  const dbPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'ai_video_interview_user',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Kafka service
  const kafkaService = new KafkaService('idempotency-test');
  const idempotencyService = new EventIdempotencyService(dbPool);

  // Test data
  const testUserId = uuidv4();
  const eventId = uuidv4();
  const serviceName = 'test-service';
  
  const testEvent = {
    eventId,
    eventType: 'USER_PROFILE_UPDATED',
    aggregateId: testUserId,
    aggregateType: 'User',
    version: 1,
    timestamp: Date.now(),
    payload: {
      userId: testUserId,
      email: 'updated@example.com',
      name: 'Updated User',
      profileData: { age: 30, location: 'New York' }
    }
  };

  let processedCount = 0;

  // Mock event handler
  const eventHandler = async (payload) => {
    console.log(`⚙️ Processing event for user: ${payload.userId}`);
    processedCount++;
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`✅ Event processed successfully (count: ${processedCount})`);
  };

  try {
    console.log('🔗 Connecting to database...');
    await dbPool.query('SELECT 1'); // Test connection
    console.log('✅ Database connected\n');

    // Test 1: First event processing
    console.log('📤 Test 1: Processing event for the first time...');
    console.log(`Event ID: ${eventId}`);
    console.log(`Service: ${serviceName}`);
    
    const firstProcessed = await idempotencyService.processEventSafely(
      eventId,
      testEvent.eventType,
      serviceName,
      testEvent.payload,
      eventHandler
    );

    if (firstProcessed && processedCount === 1) {
      console.log('✅ First processing successful\n');
    } else {
      console.log('❌ First processing failed\n');
    }

    // Test 2: Duplicate event processing
    console.log('📤 Test 2: Processing the same event again (should be skipped)...');
    
    const secondProcessed = await idempotencyService.processEventSafely(
      eventId,
      testEvent.eventType,
      serviceName,
      testEvent.payload,
      eventHandler
    );

    if (!secondProcessed && processedCount === 1) {
      console.log('✅ Duplicate event correctly skipped\n');
    } else {
      console.log('❌ Duplicate event was not properly handled\n');
    }

    // Test 3: Same event ID, different service
    console.log('📤 Test 3: Processing same event ID with different service...');
    
    const differentServiceProcessed = await idempotencyService.processEventSafely(
      eventId,
      testEvent.eventType,
      'different-service',
      testEvent.payload,
      eventHandler
    );

    if (differentServiceProcessed && processedCount === 2) {
      console.log('✅ Same event ID with different service processed correctly\n');
    } else {
      console.log('❌ Same event ID with different service failed\n');
    }

    // Test 4: Different event ID, same service
    console.log('📤 Test 4: Processing different event ID with same service...');
    
    const newEventId = uuidv4();
    const differentEventProcessed = await idempotencyService.processEventSafely(
      newEventId,
      testEvent.eventType,
      serviceName,
      { ...testEvent.payload, eventId: newEventId },
      eventHandler
    );

    if (differentEventProcessed && processedCount === 3) {
      console.log('✅ Different event ID with same service processed correctly\n');
    } else {
      console.log('❌ Different event ID with same service failed\n');
    }

    // Test 5: Verify database state
    console.log('📊 Test 5: Verifying processed_events table...');
    
    const query = `
      SELECT event_id, event_type, service_name, processed_at 
      FROM processed_events 
      WHERE event_id IN ($1, $2)
      ORDER BY processed_at ASC
    `;
    const result = await dbPool.query(query, [eventId, newEventId]);
    
    console.log(`📝 Found ${result.rows.length} processed events in database:`);
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.event_id} | ${row.event_type} | ${row.service_name} | ${row.processed_at}`);
    });

    if (result.rows.length === 3) {
      console.log('✅ Database state is correct\n');
    } else {
      console.log('❌ Database state is incorrect\n');
    }

    // Test 6: Kafka integration with idempotency
    console.log('📤 Test 6: Testing Kafka + Idempotency integration...');
    
    let kafkaMessageCount = 0;
    const kafkaEventId = uuidv4();
    
    // Setup consumer with idempotency
    await kafkaService.subscribe(
      'user-events',
      'idempotency-test-group',
      async (message) => {
        const event = JSON.parse(message.value.toString());
        console.log(`📨 Kafka message received: ${event.eventId}`);
        
        const wasProcessed = await idempotencyService.processEventSafely(
          event.eventId,
          event.eventType,
          'kafka-consumer-service',
          event.payload,
          async (payload) => {
            kafkaMessageCount++;
            console.log(`🔄 Kafka event processed (count: ${kafkaMessageCount})`);
          }
        );
        
        if (wasProcessed) {
          console.log(`✅ Kafka event ${event.eventId} processed successfully`);
        } else {
          console.log(`⏭️ Kafka event ${event.eventId} skipped (already processed)`);
        }
      },
      {
        fromBeginning: false,
        autoCommit: false,
        mode: 'eachBatch'
      }
    );

    // Send same event multiple times via Kafka
    const kafkaTestEvent = { ...testEvent, eventId: kafkaEventId };
    
    console.log('📡 Sending event via Kafka (first time)...');
    await kafkaService.publishEvent('user-events', kafkaTestEvent, { partitionKey: testUserId });
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for processing
    
    console.log('📡 Sending same event via Kafka (second time)...');
    await kafkaService.publishEvent('user-events', kafkaTestEvent, { partitionKey: testUserId });
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for processing

    if (kafkaMessageCount === 1) {
      console.log('✅ Kafka idempotency test passed\n');
    } else {
      console.log(`❌ Kafka idempotency test failed (processed ${kafkaMessageCount} times)\n`);
    }

    console.log('🎉 Event Idempotency Test Completed!');
    console.log('\n📋 Test Results Summary:');
    console.log(`  ✅ First event processing: ${firstProcessed ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Duplicate event skipping: ${!secondProcessed ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Different service processing: ${differentServiceProcessed ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Different event processing: ${differentEventProcessed ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Database verification: ${result.rows.length === 3 ? 'PASSED' : 'FAILED'}`);
    console.log(`  ✅ Kafka idempotency: ${kafkaMessageCount === 1 ? 'PASSED' : 'FAILED'}`);
    console.log(`  📊 Total events processed: ${processedCount + kafkaMessageCount}`);

  } catch (error) {
    console.error('❌ Idempotency Test Failed:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      await kafkaService.disconnect();
      await dbPool.end();
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️ Cleanup warning:', cleanupError.message);
    }
    
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️ Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the test
if (require.main === module) {
  testIdempotency().catch(console.error);
}

module.exports = { testIdempotency };
