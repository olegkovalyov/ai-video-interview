#!/bin/bash

# Send test invitation.completed event to Kafka
# This simulates Interview Service publishing an event after interview completion

echo "============================================================"
echo "Sending test invitation.completed event to Kafka"
echo "============================================================"

# Check if Kafka container is running
if ! docker ps | grep -q "ai-interview-kafka"; then
    echo "❌ Error: Kafka container is not running!"
    echo "Please start Kafka first: docker compose up -d"
    exit 1
fi

EVENT_ID="evt-$(date +%s)"
INVITATION_ID="inv-test-$(date +%s)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Build JSON as single line (important for Kafka!)
EVENT_JSON="{\"eventId\":\"${EVENT_ID}\",\"eventType\":\"invitation.completed\",\"timestamp\":\"${TIMESTAMP}\",\"version\":1,\"payload\":{\"invitationId\":\"${INVITATION_ID}\",\"candidateId\":\"cand-john-doe-123\",\"templateId\":\"tmpl-senior-dev\",\"templateTitle\":\"Senior Developer Interview\",\"companyName\":\"Tech Corp\",\"completedAt\":\"${TIMESTAMP}\",\"language\":\"en\",\"questions\":[{\"id\":\"q-1\",\"text\":\"What is dependency injection and why is it useful in software development?\",\"type\":\"text\",\"orderIndex\":0},{\"id\":\"q-2\",\"text\":\"Explain the difference between SQL and NoSQL databases. When would you choose one over the other?\",\"type\":\"text\",\"orderIndex\":1},{\"id\":\"q-3\",\"text\":\"Which of the following is a valid HTTP status code for a successful POST request that creates a resource?\",\"type\":\"multiple_choice\",\"orderIndex\":2,\"options\":[{\"id\":\"opt-1\",\"text\":\"200 OK\",\"isCorrect\":false},{\"id\":\"opt-2\",\"text\":\"201 Created\",\"isCorrect\":true},{\"id\":\"opt-3\",\"text\":\"204 No Content\",\"isCorrect\":false},{\"id\":\"opt-4\",\"text\":\"301 Moved Permanently\",\"isCorrect\":false}]}],\"responses\":[{\"id\":\"r-1\",\"questionId\":\"q-1\",\"textAnswer\":\"Dependency injection is a design pattern where dependencies are provided to a class rather than created inside it. It promotes loose coupling, improves testability by allowing mock dependencies, and enhances modularity in software design.\"},{\"id\":\"r-2\",\"questionId\":\"q-2\",\"textAnswer\":\"SQL databases are relational with structured schemas and ACID transactions, ideal for complex queries. NoSQL databases offer flexible schemas and horizontal scaling, better for unstructured data and real-time analytics. Choose SQL for data integrity, NoSQL for scalability.\"},{\"id\":\"r-3\",\"questionId\":\"q-3\",\"selectedOptionId\":\"opt-2\"}]}}"

echo ""
echo "📤 Sending event to topic: interview-events"
echo "   Event ID: ${EVENT_ID}"
echo "   Invitation ID: ${INVITATION_ID}"
echo ""

# Send message to Kafka using kafka-console-producer
echo "${EVENT_JSON}" | docker exec -i ai-interview-kafka kafka-console-producer \
    --bootstrap-server localhost:9092 \
    --topic interview-events

if [ $? -eq 0 ]; then
    echo "✅ Event sent successfully!"
    echo ""
    echo "📺 Check ai-analysis-service logs for processing output"
    echo "   The service should receive and analyze the interview automatically"
else
    echo "❌ Failed to send event"
    exit 1
fi
