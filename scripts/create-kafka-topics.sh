#!/bin/bash

# Create Kafka topics for AI Video Interview Platform
# Run this script after starting Kafka with: npm run kafka:up

echo "Creating Kafka topics for AI Video Interview Platform..."

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
sleep 10

# Define topics
TOPICS=(
    "user-events"
    "interview-events" 
    "media-events"
    "notification-events"
    "ai-analysis-events"
    "audit-events"
    # Command topics for RPC-style communication
    "user-commands"
    "auth-commands.login"
    "auth-commands.refresh"
    "user-commands.register"
)

# Create topics
for topic in "${TOPICS[@]}"; do
    echo "Creating topic: $topic"
    docker exec ai-interview-kafka kafka-topics \
        --bootstrap-server localhost:9092 \
        --create \
        --topic "$topic" \
        --partitions 3 \
        --replication-factor 1 \
        --if-not-exists
done

echo "✅ All Kafka topics created successfully!"
echo "🌐 Access Kafka UI at: http://localhost:8080"
echo ""
echo "Created topics:"
for topic in "${TOPICS[@]}"; do
    echo "  - $topic"
done
