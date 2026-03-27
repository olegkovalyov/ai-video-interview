#!/bin/bash

# =============================================================================
# AI Analysis Service - Sandbox Test
# Tests: health check, Groq API connection, full analysis
# Use --non-interactive to skip prompts (for CI)
# =============================================================================

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${COMMON_DIR}/common.sh"

NON_INTERACTIVE=false
if [ "$1" == "--non-interactive" ]; then
  NON_INTERACTIVE=true
fi

BASE_URL="${AI_ANALYSIS_SERVICE}"

header "AI Analysis Service - Sandbox Test"
echo "Target: $BASE_URL"
separator

# 1. Health check
log_step 1 3 "Checking health..."
curl -s "$BASE_URL/sandbox/health" | jq .
separator

# 2. Test Groq connection
log_step 2 3 "Testing Groq API connection..."
echo "   (This will make a real API call)"
if [ "$NON_INTERACTIVE" = false ]; then
  read -p "   Press Enter to continue or Ctrl+C to skip..."
fi
curl -s "$BASE_URL/sandbox/test-groq" | jq .
separator

# 3. Full analysis test
log_step 3 3 "Running full interview analysis..."
echo "   Sending test interview with 3 questions..."
if [ "$NON_INTERACTIVE" = false ]; then
  read -p "   Press Enter to continue or Ctrl+C to skip..."
fi

curl -s -X POST "$BASE_URL/sandbox/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "invitationId": "inv-test-001",
    "candidateId": "cand-john-doe",
    "templateId": "tmpl-senior-dev",
    "templateTitle": "Senior Developer Interview",
    "companyName": "Tech Corp",
    "language": "en",
    "questions": [
      {
        "id": "q-1",
        "text": "What is dependency injection and why is it useful in software development?",
        "type": "text",
        "orderIndex": 0
      },
      {
        "id": "q-2",
        "text": "Explain the difference between SQL and NoSQL databases. When would you choose one over the other?",
        "type": "text",
        "orderIndex": 1
      },
      {
        "id": "q-3",
        "text": "Which of the following is a valid HTTP status code for a successful POST request that creates a resource?",
        "type": "multiple_choice",
        "orderIndex": 2,
        "options": [
          {"id": "opt-1", "text": "200 OK", "isCorrect": false},
          {"id": "opt-2", "text": "201 Created", "isCorrect": true},
          {"id": "opt-3", "text": "204 No Content", "isCorrect": false},
          {"id": "opt-4", "text": "301 Moved Permanently", "isCorrect": false}
        ]
      }
    ],
    "responses": [
      {
        "id": "r-1",
        "questionId": "q-1",
        "textAnswer": "Dependency injection is a design pattern where dependencies are provided to a class rather than created inside it. It is useful because it promotes loose coupling, makes code more testable by allowing mock dependencies, and improves modularity. In practice, a class receives its dependencies through constructor parameters or setter methods instead of instantiating them directly."
      },
      {
        "id": "r-2",
        "questionId": "q-2",
        "textAnswer": "SQL databases are relational and use structured query language with predefined schemas. They are great for complex queries and ACID transactions. NoSQL databases are non-relational and offer flexible schemas, horizontal scaling, and are better for unstructured data. I would choose SQL for financial systems requiring data integrity, and NoSQL for real-time analytics or when dealing with varying data structures."
      },
      {
        "id": "r-3",
        "questionId": "q-3",
        "selectedOptionId": "opt-2"
      }
    ]
  }' | jq .

separator
log_success "Test completed! Check the service console for detailed logs."
