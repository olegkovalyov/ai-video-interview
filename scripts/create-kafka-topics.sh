#!/bin/bash

# Kafka Topics Management Script for AI Video Interview Platform
# This script performs full Kafka reset and creates minimal topic set
# 
# Usage: ./create-kafka-topics.sh
# Prerequisites: Kafka container must be running (docker compose up -d)

set -e  # Exit on any error

echo "🔧 Kafka Topics Management - Full Reset & Setup"
echo "=============================================="

# Check if Kafka container is running
if ! docker ps | grep -q "ai-interview-kafka"; then
    echo "❌ Error: Kafka container is not running!"
    echo "Please start Kafka first: docker compose up -d"
    exit 1
fi

# Wait for Kafka to be fully ready
echo "⏳ Waiting for Kafka to be ready..."
for i in {1..30}; do
    if docker exec ai-interview-kafka kafka-topics --bootstrap-server localhost:9092 --list >/dev/null 2>&1; then
        echo "✅ Kafka is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout: Kafka failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

echo ""
echo "🧹 STEP 1: Full Kafka Reset"
echo "============================"

# Get list of existing topics (excluding internal topics)
EXISTING_TOPICS=$(docker exec ai-interview-kafka kafka-topics \
    --bootstrap-server localhost:9092 \
    --list 2>/dev/null | grep -v "^__" || true)

if [ -n "$EXISTING_TOPICS" ]; then
    echo "🗑️  Deleting existing topics:"
    echo "$EXISTING_TOPICS" | while read -r topic; do
        if [ -n "$topic" ]; then
            echo "   - Deleting: $topic"
            docker exec ai-interview-kafka kafka-topics \
                --bootstrap-server localhost:9092 \
                --delete --topic "$topic" >/dev/null 2>&1 || true
        fi
    done
    
    # Wait for topics to be deleted
    sleep 2
else
    echo "ℹ️  No existing topics found"
fi

# Reset consumer groups (delete all consumer group data)
echo "🔄 Resetting consumer groups..."
CONSUMER_GROUPS=$(docker exec ai-interview-kafka kafka-consumer-groups \
    --bootstrap-server localhost:9092 \
    --list 2>/dev/null || true)

if [ -n "$CONSUMER_GROUPS" ]; then
    echo "$CONSUMER_GROUPS" | while read -r group; do
        if [ -n "$group" ] && [ "$group" != "GROUP" ]; then
            echo "   - Resetting group: $group"
            docker exec ai-interview-kafka kafka-consumer-groups \
                --bootstrap-server localhost:9092 \
                --delete --group "$group" >/dev/null 2>&1 || true
        fi
    done
else
    echo "ℹ️  No consumer groups found"
fi

echo ""
echo "🏗️  STEP 2: Creating Kafka Topics"
echo "================================"

# Create user-events topic (FROM User Service to other services)
echo "📝 Creating topic: user-events"
docker exec ai-interview-kafka kafka-topics --create \
    --topic user-events \
    --bootstrap-server localhost:9092 \
    --partitions 3 \
    --replication-factor 1 \
    --config retention.ms=604800000 \
    --config segment.ms=86400000 \
    --if-not-exists

# Create user-events DLQ
echo "📝 Creating DLQ topic: user-events-dlq"
docker exec ai-interview-kafka kafka-topics --create \
    --topic user-events-dlq \
    --bootstrap-server localhost:9092 \
    --partitions 1 \
    --replication-factor 1 \
    --config retention.ms=2592000000 \
    --if-not-exists

# Create interview-events topic (FROM Interview Service)
echo "📝 Creating topic: interview-events"
docker exec ai-interview-kafka kafka-topics --create \
    --topic interview-events \
    --bootstrap-server localhost:9092 \
    --partitions 3 \
    --replication-factor 1 \
    --config retention.ms=604800000 \
    --config segment.ms=86400000 \
    --if-not-exists

# Create interview-events DLQ
echo "📝 Creating DLQ topic: interview-events-dlq"
docker exec ai-interview-kafka kafka-topics --create \
    --topic interview-events-dlq \
    --bootstrap-server localhost:9092 \
    --partitions 1 \
    --replication-factor 1 \
    --config retention.ms=2592000000 \
    --if-not-exists

# Create analysis-events topic (FROM AI Analysis Service)
echo "📝 Creating topic: analysis-events"
docker exec ai-interview-kafka kafka-topics --create \
    --topic analysis-events \
    --bootstrap-server localhost:9092 \
    --partitions 3 \
    --replication-factor 1 \
    --config retention.ms=604800000 \
    --config segment.ms=86400000 \
    --if-not-exists

# Create analysis-events DLQ
echo "📝 Creating DLQ topic: analysis-events-dlq"
docker exec ai-interview-kafka kafka-topics --create \
    --topic analysis-events-dlq \
    --bootstrap-server localhost:9092 \
    --partitions 1 \
    --replication-factor 1 \
    --config retention.ms=2592000000 \
    --if-not-exists

echo ""
echo "✅ Kafka Setup Complete!"
echo "========================"
echo ""
echo "📊 Created Topics:"
echo "  - user-events (3 partitions) - FROM User Service"
echo "  - user-events-dlq (1 partition)"
echo "  - interview-events (3 partitions) - FROM Interview Service"
echo "  - interview-events-dlq (1 partition)"
echo "  - analysis-events (3 partitions) - FROM AI Analysis Service"
echo "  - analysis-events-dlq (1 partition)"
echo ""
echo "🔧 Topic Configuration:"
echo "  - Retention: 7 days (main topics), 30 days (DLQ)"
echo "  - Partitioning: By userId/invitationId for ordering"
echo ""
echo "📐 Event Flow:"
echo "  Interview Service → interview-events → AI Analysis Service"
echo "  AI Analysis Service → analysis-events → Interview Service"
echo ""
echo "🌐 Access Kafka UI: http://localhost:8080"
echo "📋 List topics: docker exec ai-interview-kafka kafka-topics --bootstrap-server localhost:9092 --list"
echo ""
echo "🎯 Ready for events!"
