#!/bin/bash

# =============================================================================
# Kafka Topics Management - Full Reset & Setup
# Deletes all existing topics/consumer groups and creates the required set
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${COMMON_DIR}/common.sh"

header "Kafka Topics Management - Full Reset & Setup"

require_container "$KAFKA_CONTAINER"

# Wait for Kafka to be fully ready
log_info "Waiting for Kafka to be ready..."
for i in {1..30}; do
  if docker exec "$KAFKA_CONTAINER" kafka-topics --bootstrap-server localhost:9092 --list >/dev/null 2>&1; then
    log_success "Kafka is ready!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    log_error "Timeout: Kafka failed to start within 30 seconds"
    exit 1
  fi
  sleep 1
done

separator
header "STEP 1: Full Kafka Reset"

# Delete existing topics (excluding internal)
EXISTING_TOPICS=$(docker exec "$KAFKA_CONTAINER" kafka-topics \
  --bootstrap-server localhost:9092 \
  --list 2>/dev/null | grep -v "^__" || true)

if [ -n "$EXISTING_TOPICS" ]; then
  echo "Deleting existing topics:"
  echo "$EXISTING_TOPICS" | while read -r topic; do
    if [ -n "$topic" ]; then
      echo "   - Deleting: $topic"
      docker exec "$KAFKA_CONTAINER" kafka-topics \
        --bootstrap-server localhost:9092 \
        --delete --topic "$topic" >/dev/null 2>&1 || true
    fi
  done
  sleep 2
else
  echo "No existing topics found"
fi

# Reset consumer groups
log_info "Resetting consumer groups..."
CONSUMER_GROUPS=$(docker exec "$KAFKA_CONTAINER" kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --list 2>/dev/null || true)

if [ -n "$CONSUMER_GROUPS" ]; then
  echo "$CONSUMER_GROUPS" | while read -r group; do
    if [ -n "$group" ] && [ "$group" != "GROUP" ]; then
      echo "   - Resetting group: $group"
      docker exec "$KAFKA_CONTAINER" kafka-consumer-groups \
        --bootstrap-server localhost:9092 \
        --delete --group "$group" >/dev/null 2>&1 || true
    fi
  done
else
  echo "No consumer groups found"
fi

separator
header "STEP 2: Creating Kafka Topics"

# Helper to create a topic + its DLQ
create_topic_pair() {
  local topic=$1
  local partitions=${2:-3}
  local retention_days=${3:-7}
  local dlq_retention_days=${4:-30}
  local retention_ms=$((retention_days * 86400000))
  local dlq_retention_ms=$((dlq_retention_days * 86400000))

  echo "Creating topic: ${topic} (${partitions} partitions, ${retention_days}d retention)"
  docker exec "$KAFKA_CONTAINER" kafka-topics --create \
    --topic "$topic" \
    --bootstrap-server localhost:9092 \
    --partitions "$partitions" \
    --replication-factor 1 \
    --config "retention.ms=${retention_ms}" \
    --config segment.ms=86400000 \
    --if-not-exists

  echo "Creating DLQ:   ${topic}-dlq (1 partition, ${dlq_retention_days}d retention)"
  docker exec "$KAFKA_CONTAINER" kafka-topics --create \
    --topic "${topic}-dlq" \
    --bootstrap-server localhost:9092 \
    --partitions 1 \
    --replication-factor 1 \
    --config "retention.ms=${dlq_retention_ms}" \
    --if-not-exists
}

create_topic_pair "auth-events" 3 7 30
create_topic_pair "user-events" 3 7 30
create_topic_pair "interview-events" 3 7 30
create_topic_pair "analysis-events" 3 7 30

separator
log_success "Kafka Setup Complete!"
echo ""
echo "Created Topics:"
echo "  - auth-events (3 partitions)      - FROM API Gateway (login/logout)"
echo "  - user-events (3 partitions)      - FROM User Service"
echo "  - interview-events (3 partitions) - FROM Interview Service"
echo "  - analysis-events (3 partitions)  - FROM AI Analysis Service"
echo "  + 4 DLQ topics (1 partition each)"
echo ""
echo "Event Flow:"
echo "  Interview Service -> interview-events -> AI Analysis Service"
echo "  AI Analysis Service -> analysis-events -> Interview Service"
echo ""
echo "Kafka UI: http://localhost:8080"
