#!/bin/bash

# Send test invitation.completed event with 55 questions to test chunked summary
# Mix of correct, partially correct, and wrong answers
# Includes: polling status, Kafka event listener, API result fetch

set -e

API_URL="http://localhost:8005"
POLL_INTERVAL=5
MAX_POLLS=120  # 10 minutes max

echo "============================================================"
echo "🧪 AI Analysis Service - Full Integration Test (55 Questions)"
echo "============================================================"

# Check prerequisites
if ! docker ps | grep -q "ai-interview-kafka"; then
    echo "❌ Error: Kafka container is not running!"
    exit 1
fi

if ! curl -s "${API_URL}/health" > /dev/null 2>&1; then
    echo "❌ Error: AI Analysis Service is not running on ${API_URL}"
    echo "   Start it with: cd apps/ai-analysis-service && npm run start:dev"
    exit 1
fi

echo "✅ Prerequisites OK"
echo ""

EVENT_ID="evt-55q-$(date +%s)"
INVITATION_ID="inv-55q-$(date +%s)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Build questions and responses arrays
# Mix: ~20 good answers, ~20 partial answers, ~15 bad answers

read -r -d '' QUESTIONS << 'QUESTIONS_EOF' || true
[
  {"id":"q-1","text":"What is dependency injection and why is it useful?","type":"text","orderIndex":0},
  {"id":"q-2","text":"Explain REST API principles","type":"text","orderIndex":1},
  {"id":"q-3","text":"What is the difference between SQL and NoSQL?","type":"text","orderIndex":2},
  {"id":"q-4","text":"Explain SOLID principles","type":"text","orderIndex":3},
  {"id":"q-5","text":"What is Docker and why use it?","type":"text","orderIndex":4},
  {"id":"q-6","text":"Explain microservices architecture","type":"text","orderIndex":5},
  {"id":"q-7","text":"What is Kubernetes?","type":"text","orderIndex":6},
  {"id":"q-8","text":"Explain event-driven architecture","type":"text","orderIndex":7},
  {"id":"q-9","text":"What is CQRS pattern?","type":"text","orderIndex":8},
  {"id":"q-10","text":"Explain CAP theorem","type":"text","orderIndex":9},
  {"id":"q-11","text":"What is Redis and when to use it?","type":"text","orderIndex":10},
  {"id":"q-12","text":"Explain message queues (Kafka, RabbitMQ)","type":"text","orderIndex":11},
  {"id":"q-13","text":"What is GraphQL and how differs from REST?","type":"text","orderIndex":12},
  {"id":"q-14","text":"Explain database indexing","type":"text","orderIndex":13},
  {"id":"q-15","text":"What is CI/CD pipeline?","type":"text","orderIndex":14},
  {"id":"q-16","text":"Explain OAuth 2.0 flow","type":"text","orderIndex":15},
  {"id":"q-17","text":"What is JWT and how it works?","type":"text","orderIndex":16},
  {"id":"q-18","text":"Explain WebSocket protocol","type":"text","orderIndex":17},
  {"id":"q-19","text":"What is load balancing?","type":"text","orderIndex":18},
  {"id":"q-20","text":"Explain database transactions and ACID","type":"text","orderIndex":19},
  {"id":"q-21","text":"What is TypeScript and benefits over JavaScript?","type":"text","orderIndex":20},
  {"id":"q-22","text":"Explain React hooks","type":"text","orderIndex":21},
  {"id":"q-23","text":"What is Virtual DOM?","type":"text","orderIndex":22},
  {"id":"q-24","text":"Explain CSS Grid vs Flexbox","type":"text","orderIndex":23},
  {"id":"q-25","text":"What is webpack and why use it?","type":"text","orderIndex":24},
  {"id":"q-26","text":"Explain Node.js event loop","type":"text","orderIndex":25},
  {"id":"q-27","text":"What is NestJS framework?","type":"text","orderIndex":26},
  {"id":"q-28","text":"Explain Next.js SSR vs SSG","type":"text","orderIndex":27},
  {"id":"q-29","text":"What is PostgreSQL and its features?","type":"text","orderIndex":28},
  {"id":"q-30","text":"Explain MongoDB aggregation pipeline","type":"text","orderIndex":29},
  {"id":"q-31","text":"What is Git branching strategy?","type":"text","orderIndex":30},
  {"id":"q-32","text":"Explain unit testing vs integration testing","type":"text","orderIndex":31},
  {"id":"q-33","text":"What is TDD approach?","type":"text","orderIndex":32},
  {"id":"q-34","text":"Explain code review best practices","type":"text","orderIndex":33},
  {"id":"q-35","text":"What is technical debt?","type":"text","orderIndex":34},
  {"id":"q-36","text":"Explain agile methodology","type":"text","orderIndex":35},
  {"id":"q-37","text":"What is API rate limiting?","type":"text","orderIndex":36},
  {"id":"q-38","text":"Explain caching strategies","type":"text","orderIndex":37},
  {"id":"q-39","text":"What is CDN and how it works?","type":"text","orderIndex":38},
  {"id":"q-40","text":"Explain SSL/TLS encryption","type":"text","orderIndex":39},
  {"id":"q-41","text":"What is XSS and how to prevent it?","type":"text","orderIndex":40},
  {"id":"q-42","text":"Explain SQL injection prevention","type":"text","orderIndex":41},
  {"id":"q-43","text":"What is CORS?","type":"text","orderIndex":42},
  {"id":"q-44","text":"Explain horizontal vs vertical scaling","type":"text","orderIndex":43},
  {"id":"q-45","text":"What is database sharding?","type":"text","orderIndex":44},
  {"id":"q-46","text":"Explain observability (logs, metrics, traces)","type":"text","orderIndex":45},
  {"id":"q-47","text":"What is Prometheus and Grafana?","type":"text","orderIndex":46},
  {"id":"q-48","text":"Explain distributed tracing","type":"text","orderIndex":47},
  {"id":"q-49","text":"What is feature flags?","type":"text","orderIndex":48},
  {"id":"q-50","text":"Explain blue-green deployment","type":"text","orderIndex":49},
  {"id":"q-51","text":"What is canary release?","type":"text","orderIndex":50},
  {"id":"q-52","text":"Explain infrastructure as code","type":"text","orderIndex":51},
  {"id":"q-53","text":"What is Terraform?","type":"text","orderIndex":52},
  {"id":"q-54","text":"Explain serverless architecture","type":"text","orderIndex":53},
  {"id":"q-55","text":"What is AWS Lambda?","type":"text","orderIndex":54}
]
QUESTIONS_EOF

# Responses: Good (q1-20), Partial (q21-40), Bad (q41-55)
read -r -d '' RESPONSES << 'RESPONSES_EOF' || true
[
  {"id":"r-1","questionId":"q-1","textAnswer":"Dependency injection is a design pattern where dependencies are provided externally rather than created inside a class. Benefits: loose coupling, better testability with mocks, improved modularity, and easier maintenance. Common implementations include constructor injection, setter injection, and interface injection."},
  {"id":"r-2","questionId":"q-2","textAnswer":"REST principles: 1) Statelessness - each request contains all info needed. 2) Client-Server separation. 3) Uniform interface with standard HTTP methods. 4) Layered system. 5) Cacheable responses. 6) Resource-based URLs. RESTful APIs use JSON/XML for data exchange."},
  {"id":"r-3","questionId":"q-3","textAnswer":"SQL databases are relational with fixed schemas, ACID transactions, and complex join queries. NoSQL offers flexible schemas, horizontal scaling, and various models (document, key-value, graph). Use SQL for data integrity and complex relations, NoSQL for scalability and unstructured data."},
  {"id":"r-4","questionId":"q-4","textAnswer":"SOLID: S-Single Responsibility (one reason to change), O-Open/Closed (open for extension, closed for modification), L-Liskov Substitution (subtypes must be substitutable), I-Interface Segregation (specific interfaces), D-Dependency Inversion (depend on abstractions)."},
  {"id":"r-5","questionId":"q-5","textAnswer":"Docker is a containerization platform that packages applications with dependencies into isolated containers. Benefits: consistent environments across dev/prod, resource efficiency vs VMs, easy scaling, version control for infrastructure, simplified deployment and rollback."},
  {"id":"r-6","questionId":"q-6","textAnswer":"Microservices architecture decomposes applications into small, independent services that communicate via APIs. Benefits: independent deployment, technology flexibility, fault isolation, team autonomy. Challenges: distributed complexity, network latency, data consistency."},
  {"id":"r-7","questionId":"q-7","textAnswer":"Kubernetes is a container orchestration platform. Features: automated deployment and scaling, self-healing, service discovery, load balancing, secret management, rolling updates. Components: pods, services, deployments, namespaces, ingress controllers."},
  {"id":"r-8","questionId":"q-8","textAnswer":"Event-driven architecture uses events to trigger and communicate between services. Components: event producers, event brokers (Kafka, RabbitMQ), event consumers. Benefits: loose coupling, scalability, real-time processing. Patterns: event sourcing, CQRS, saga."},
  {"id":"r-9","questionId":"q-9","textAnswer":"CQRS (Command Query Responsibility Segregation) separates read and write operations into different models. Commands modify state, queries read state. Benefits: optimized read/write models, scalability, eventual consistency. Often combined with event sourcing."},
  {"id":"r-10","questionId":"q-10","textAnswer":"CAP theorem states distributed systems can only guarantee 2 of 3: Consistency (all nodes see same data), Availability (every request gets response), Partition tolerance (system works despite network failures). Choose CP or AP based on requirements."},
  {"id":"r-11","questionId":"q-11","textAnswer":"Redis is an in-memory data store supporting strings, hashes, lists, sets, sorted sets. Use cases: caching, session storage, real-time analytics, pub/sub messaging, rate limiting, leaderboards. Features: persistence options, clustering, Lua scripting."},
  {"id":"r-12","questionId":"q-12","textAnswer":"Message queues enable async communication. Kafka: distributed log, high throughput, message retention, partitioning for parallelism. RabbitMQ: traditional broker, flexible routing, multiple protocols. Kafka for streaming/analytics, RabbitMQ for task queues."},
  {"id":"r-13","questionId":"q-13","textAnswer":"GraphQL is a query language for APIs. Clients request exactly needed data, reducing over/under-fetching. Single endpoint vs multiple REST endpoints. Strongly typed schema. Real-time with subscriptions. Challenges: complexity, caching, N+1 queries."},
  {"id":"r-14","questionId":"q-14","textAnswer":"Database indexes are data structures improving query speed. Types: B-tree (default), hash, GIN/GiST (full-text), partial indexes. Trade-offs: faster reads but slower writes and storage overhead. Index on frequently queried columns, avoid over-indexing."},
  {"id":"r-15","questionId":"q-15","textAnswer":"CI/CD automates software delivery. CI: automated builds and tests on code changes. CD: automated deployment to environments. Tools: Jenkins, GitLab CI, GitHub Actions. Stages: build, test, security scan, deploy to staging, deploy to production."},
  {"id":"r-16","questionId":"q-16","textAnswer":"OAuth 2.0 flows: Authorization Code (web apps with backend), Implicit (legacy SPAs), Client Credentials (machine-to-machine), PKCE (mobile/SPAs). Components: resource owner, client, authorization server, resource server. Tokens: access token, refresh token."},
  {"id":"r-17","questionId":"q-17","textAnswer":"JWT (JSON Web Token) is a signed token for stateless authentication. Structure: header (algorithm), payload (claims), signature. Benefits: no server session storage, cross-domain auth. Considerations: token size, cannot revoke before expiry (use blocklist)."},
  {"id":"r-18","questionId":"q-18","textAnswer":"WebSocket provides full-duplex communication over single TCP connection. Unlike HTTP request-response, both sides can send messages anytime. Use cases: chat, real-time updates, gaming, live feeds. Handshake upgrades from HTTP. Consider Socket.io for fallbacks."},
  {"id":"r-19","questionId":"q-19","textAnswer":"Load balancing distributes traffic across servers. Algorithms: round-robin, least connections, IP hash, weighted. Types: L4 (transport) vs L7 (application). Tools: Nginx, HAProxy, cloud load balancers. Health checks remove unhealthy instances."},
  {"id":"r-20","questionId":"q-20","textAnswer":"ACID properties: Atomicity (all or nothing), Consistency (valid state transitions), Isolation (concurrent transactions don't interfere), Durability (committed data persists). Isolation levels: read uncommitted, read committed, repeatable read, serializable."},
  {"id":"r-21","questionId":"q-21","textAnswer":"TypeScript adds types to JavaScript. It helps catch errors at compile time. Has interfaces and generics. Good for large projects."},
  {"id":"r-22","questionId":"q-22","textAnswer":"React hooks like useState and useEffect let you use state in function components. useState for state, useEffect for side effects. There are also custom hooks."},
  {"id":"r-23","questionId":"q-23","textAnswer":"Virtual DOM is a copy of real DOM in memory. React compares changes and updates only what's needed. Makes things faster."},
  {"id":"r-24","questionId":"q-24","textAnswer":"Flexbox is for one-dimensional layouts, Grid is for two-dimensional. Flexbox for rows or columns, Grid for complex layouts with rows and columns together."},
  {"id":"r-25","questionId":"q-25","textAnswer":"Webpack bundles JavaScript modules and assets. It has loaders for different file types. Creates optimized bundles for production."},
  {"id":"r-26","questionId":"q-26","textAnswer":"Node.js event loop handles async operations. It has phases like timers, pending callbacks, poll. Non-blocking I/O makes it efficient."},
  {"id":"r-27","questionId":"q-27","textAnswer":"NestJS is a Node.js framework using TypeScript. It has modules, controllers, services. Similar to Angular structure. Good for enterprise apps."},
  {"id":"r-28","questionId":"q-28","textAnswer":"SSR renders on server for each request, good for dynamic content. SSG pre-renders at build time, good for static content. ISR updates static pages."},
  {"id":"r-29","questionId":"q-29","textAnswer":"PostgreSQL is a relational database. Supports JSON, full-text search, extensions. ACID compliant. Good for complex queries."},
  {"id":"r-30","questionId":"q-30","textAnswer":"MongoDB aggregation uses pipeline stages like match, group, sort. Processes documents through stages. Can do complex transformations."},
  {"id":"r-31","questionId":"q-31","textAnswer":"Git branching: main for production, develop for integration, feature branches for new work. GitFlow or trunk-based development."},
  {"id":"r-32","questionId":"q-32","textAnswer":"Unit tests test single functions in isolation. Integration tests test multiple components together. Both are important for quality."},
  {"id":"r-33","questionId":"q-33","textAnswer":"TDD means write tests first, then code. Red-green-refactor cycle. Helps design better code and catch bugs early."},
  {"id":"r-34","questionId":"q-34","textAnswer":"Code review checks code quality before merge. Look for bugs, style, performance. Give constructive feedback. Use pull requests."},
  {"id":"r-35","questionId":"q-35","textAnswer":"Technical debt is shortcuts in code that need fixing later. Like financial debt, it accumulates interest. Should be managed and paid down."},
  {"id":"r-36","questionId":"q-36","textAnswer":"Agile is iterative development with sprints. Scrum has standups, planning, retrospectives. Focus on working software and customer collaboration."},
  {"id":"r-37","questionId":"q-37","textAnswer":"Rate limiting controls request frequency. Prevents abuse and ensures fair usage. Can use token bucket or sliding window algorithms."},
  {"id":"r-38","questionId":"q-38","textAnswer":"Caching stores frequently accessed data. Strategies: cache-aside, write-through, write-behind. Use Redis or Memcached. Consider TTL and invalidation."},
  {"id":"r-39","questionId":"q-39","textAnswer":"CDN caches content at edge locations closer to users. Reduces latency and server load. Good for static assets like images and scripts."},
  {"id":"r-40","questionId":"q-40","textAnswer":"SSL/TLS encrypts data in transit. Uses certificates for authentication. HTTPS uses TLS. Prevents man-in-the-middle attacks."},
  {"id":"r-41","questionId":"q-41","textAnswer":"XSS is some kind of attack on websites. You should escape things I think."},
  {"id":"r-42","questionId":"q-42","textAnswer":"SQL injection is when hackers put SQL in forms. Use prepared statements or something."},
  {"id":"r-43","questionId":"q-43","textAnswer":"CORS is about cross-origin something. Browsers block requests sometimes. You add headers to fix it."},
  {"id":"r-44","questionId":"q-44","textAnswer":"Horizontal means more servers, vertical means bigger server. Both help with load."},
  {"id":"r-45","questionId":"q-45","textAnswer":"Sharding splits database into pieces. Each piece has some data. Helps with big databases."},
  {"id":"r-46","questionId":"q-46","textAnswer":"Observability is logs and metrics and stuff. Helps find problems in production."},
  {"id":"r-47","questionId":"q-47","textAnswer":"Prometheus collects metrics, Grafana shows dashboards. They work together for monitoring."},
  {"id":"r-48","questionId":"q-48","textAnswer":"Distributed tracing tracks requests across services. Uses trace IDs or something."},
  {"id":"r-49","questionId":"q-49","textAnswer":"Feature flags toggle features on and off. Good for testing new stuff."},
  {"id":"r-50","questionId":"q-50","textAnswer":"Blue-green has two environments. Switch between them for deploys. Less downtime."},
  {"id":"r-51","questionId":"q-51","textAnswer":"I don't really know what canary release is. Maybe something about testing?"},
  {"id":"r-52","questionId":"q-52","textAnswer":"Infrastructure as code is like writing code for servers. Terraform or something."},
  {"id":"r-53","questionId":"q-53","textAnswer":"Terraform is a tool. It does infrastructure stuff. HashiCorp made it."},
  {"id":"r-54","questionId":"q-54","textAnswer":"Serverless means no servers. Well, there are servers but you don't manage them. AWS has it."},
  {"id":"r-55","questionId":"q-55","textAnswer":"Lambda runs code without servers. You pay per execution. Event-driven."}
]
RESPONSES_EOF

# Remove newlines from JSON
QUESTIONS_CLEAN=$(echo "$QUESTIONS" | tr -d '\n' | tr -s ' ')
RESPONSES_CLEAN=$(echo "$RESPONSES" | tr -d '\n' | tr -s ' ')

# Build final event JSON
EVENT_JSON="{\"eventId\":\"${EVENT_ID}\",\"eventType\":\"invitation.completed\",\"timestamp\":\"${TIMESTAMP}\",\"version\":1,\"payload\":{\"invitationId\":\"${INVITATION_ID}\",\"candidateId\":\"cand-senior-dev-test\",\"templateId\":\"tmpl-fullstack-55q\",\"templateTitle\":\"Full-Stack Developer Interview (55 Questions)\",\"companyName\":\"TechCorp International\",\"completedAt\":\"${TIMESTAMP}\",\"language\":\"en\",\"questions\":${QUESTIONS_CLEAN},\"responses\":${RESPONSES_CLEAN}}}"

echo ""
echo "📤 Sending event to topic: interview-events"
echo "   Event ID: ${EVENT_ID}"
echo "   Questions: 55"
echo "   Expected chunks: 4 (15+15+15+10)"
echo ""

# Send message to Kafka with partition key (candidateId for ordering)
PARTITION_KEY="cand-senior-dev-test"
echo "${PARTITION_KEY}:${EVENT_JSON}" | docker exec -i ai-interview-kafka kafka-console-producer \
    --bootstrap-server localhost:9092 \
    --topic interview-events \
    --property parse.key=true \
    --property key.separator=:

if [ $? -ne 0 ]; then
    echo "❌ Failed to send event"
    exit 1
fi

echo "✅ Event sent successfully!"
echo ""

# ============================================================
# STEP 2: Start Kafka consumer in background to catch analysis.completed event
# ============================================================
echo "📡 Starting Kafka consumer for analysis-events topic..."

KAFKA_OUTPUT_FILE="/tmp/analysis-event-${INVITATION_ID}.json"
docker exec ai-interview-kafka kafka-console-consumer \
    --bootstrap-server localhost:9092 \
    --topic analysis-events \
    --from-beginning \
    --timeout-ms 600000 \
    --max-messages 1 > "${KAFKA_OUTPUT_FILE}" 2>/dev/null &
KAFKA_CONSUMER_PID=$!

echo "   Consumer PID: ${KAFKA_CONSUMER_PID}"
echo ""

# ============================================================
# STEP 3: Poll status API until completed or failed
# ============================================================
echo "⏳ Polling analysis status..."
echo ""

POLL_COUNT=0
while [ $POLL_COUNT -lt $MAX_POLLS ]; do
    POLL_COUNT=$((POLL_COUNT + 1))
    
    STATUS_RESPONSE=$(curl -s "${API_URL}/api/v1/analysis/status/${INVITATION_ID}")
    FOUND=$(echo "$STATUS_RESPONSE" | grep -o '"found":[^,]*' | cut -d':' -f2)
    STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$FOUND" = "false" ]; then
        echo "   [${POLL_COUNT}] Status: not_found (waiting for processing to start...)"
        sleep $POLL_INTERVAL
        continue
    fi
    
    echo "   [${POLL_COUNT}] Status: ${STATUS}"
    
    if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
        break
    fi
    
    sleep $POLL_INTERVAL
done

echo ""

if [ "$STATUS" != "completed" ] && [ "$STATUS" != "failed" ]; then
    echo "❌ Timeout waiting for analysis to complete"
    kill $KAFKA_CONSUMER_PID 2>/dev/null
    exit 1
fi

# ============================================================
# STEP 4: Get full analysis result via API
# ============================================================
echo "============================================================"
echo "📊 ANALYSIS RESULT"
echo "============================================================"

RESULT=$(curl -s "${API_URL}/api/v1/analysis/${INVITATION_ID}")

# Parse and display key fields
ANALYSIS_ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
OVERALL_SCORE=$(echo "$RESULT" | grep -o '"overallScore":[0-9]*' | cut -d':' -f2)
RECOMMENDATION=$(echo "$RESULT" | grep -o '"recommendation":"[^"]*"' | cut -d'"' -f4)
PROCESSING_TIME=$(echo "$RESULT" | grep -o '"processingTimeMs":[0-9]*' | cut -d':' -f2)
TOKENS_USED=$(echo "$RESULT" | grep -o '"totalTokensUsed":[0-9]*' | cut -d':' -f2)

echo ""
echo "📋 Summary:"
echo "   Analysis ID:     ${ANALYSIS_ID}"
echo "   Invitation ID:   ${INVITATION_ID}"
echo "   Status:          ${STATUS}"
echo "   Overall Score:   ${OVERALL_SCORE}/100"
echo "   Recommendation:  ${RECOMMENDATION}"
echo "   Processing Time: ${PROCESSING_TIME}ms"
echo "   Tokens Used:     ${TOKENS_USED}"
echo ""

# ============================================================
# STEP 5: Check Kafka event
# ============================================================
echo "============================================================"
echo "📨 KAFKA EVENT (analysis.completed)"
echo "============================================================"

# Wait a moment for consumer to catch up
sleep 2
kill $KAFKA_CONSUMER_PID 2>/dev/null || true

if [ -f "${KAFKA_OUTPUT_FILE}" ] && [ -s "${KAFKA_OUTPUT_FILE}" ]; then
    echo ""
    echo "✅ Event received from analysis-events topic:"
    echo ""
    cat "${KAFKA_OUTPUT_FILE}" | head -c 500
    echo ""
    echo "..."
    rm -f "${KAFKA_OUTPUT_FILE}"
else
    echo ""
    echo "⚠️  No event captured (may have been published before consumer started)"
    echo "   Check manually: docker exec ai-interview-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic analysis-events --from-beginning --timeout-ms 5000"
fi

echo ""
echo "============================================================"
echo "✅ TEST COMPLETED"
echo "============================================================"
echo ""
echo "💡 Expected results:"
echo "   - Good answers (q1-q20): scores 75-95"
echo "   - Partial answers (q21-q40): scores 50-74"  
echo "   - Bad answers (q41-q55): scores 20-49"
echo ""
echo "📺 Full result saved. View with:"
echo "   curl -s ${API_URL}/api/v1/analysis/${INVITATION_ID} | jq ."
