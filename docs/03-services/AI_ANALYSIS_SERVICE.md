# AI Analysis Service

**Status:** 🔴 Not Implemented  
**Port:** 3007  
**Technology Stack:** NestJS, TypeORM, PostgreSQL, Groq API, pgvector  
**Priority:** HIGH (Core value proposition)

---

## Overview

AI Analysis Service is responsible for analyzing candidate interview responses using LLM-based evaluation. It processes transcribed answers, extracts insights, and provides objective feedback using RAG (Retrieval-Augmented Generation) pattern.

**Key Capabilities:**
- Interview response analysis via LLM (LLama 3.3 70B)
- RAG-based contextual evaluation against job requirements
- Skills extraction and scoring
- Sentiment and communication analysis
- Comparative candidate ranking

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   AI ANALYSIS SERVICE (3007)                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Kafka Consumer Layer                    │   │
│  │  - interview.completed events                        │   │
│  │  - transcription.ready events                        │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │              Application Layer (CQRS)                │   │
│  │  Commands:                    Queries:               │   │
│  │  - AnalyzeInterview           - GetAnalysisById      │   │
│  │  - GenerateFeedback           - GetCandidateScore    │   │
│  │  - ExtractSkills              - CompareСandidates    │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │              RAG Pipeline                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │ Embedding   │→ │  Vector     │→ │   LLM       │  │   │
│  │  │ Generator   │  │  Search     │  │   Prompt    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │              Infrastructure Layer                    │   │
│  │  - GroqService (LLM API)                            │   │
│  │  - EmbeddingService (text-embedding-3-small)        │   │
│  │  - VectorRepository (pgvector)                      │   │
│  │  - AnalysisRepository (TypeORM)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    PostgreSQL            Kafka              Groq API
   (+ pgvector)        (events)         (LLama 3.3 70B)
```

---

## Groq API Integration

### Selected Models

| Model | Purpose | Rate Limit (Free) |
|-------|---------|-------------------|
| **llama-3.3-70b-versatile** | Interview analysis, feedback generation | ~6000 tokens/min |
| **llama-3.1-8b-instant** | Quick scoring, simple evaluations | ~20000 tokens/min |

### Configuration

```yaml
# Environment Variables
GROQ_API_KEY=gsk_xxxxxxxxxxxx
GROQ_MODEL_PRIMARY=llama-3.3-70b-versatile
GROQ_MODEL_FAST=llama-3.1-8b-instant
GROQ_MAX_TOKENS=4096
GROQ_TEMPERATURE=0.3
```

### Rate Limiting Strategy

```
┌─────────────────────────────────────────────────────────┐
│                  Rate Limiter                           │
│                                                         │
│  Token Bucket Algorithm:                                │
│  - Bucket size: 6000 tokens                            │
│  - Refill rate: 6000 tokens/minute                     │
│  - Queue overflow: Redis queue for backpressure        │
│                                                         │
│  Retry Policy:                                          │
│  - Max retries: 3                                       │
│  - Backoff: exponential (1s, 2s, 4s)                   │
│  - On 429: queue and retry after rate limit reset      │
└─────────────────────────────────────────────────────────┘
```

---

## RAG Pipeline

### 1. Document Preparation (Job Requirements)

```
Job Description → Chunking → Embedding → pgvector Storage

Chunk Strategy:
- Chunk size: 500 tokens
- Overlap: 50 tokens
- Metadata: section_type, importance_level
```

### 2. Query Flow (Candidate Response Analysis)

```
┌──────────────────────────────────────────────────────────────────┐
│                        RAG Query Flow                            │
│                                                                  │
│  1. Transcription     2. Embedding      3. Vector Search         │
│  ┌─────────────┐     ┌─────────────┐   ┌─────────────────────┐  │
│  │ "I have 5   │ ──▶ │ [0.12, 0.45 │ ─▶│ SELECT * FROM       │  │
│  │ years of    │     │  0.78, ...]  │   │ embeddings          │  │
│  │ React..."   │     └─────────────┘   │ ORDER BY embedding   │  │
│  └─────────────┘                       │ <-> $1 LIMIT 5       │  │
│                                        └──────────┬────────────┘  │
│                                                   │               │
│  4. Context Assembly              5. LLM Prompt                  │
│  ┌──────────────────────┐        ┌────────────────────────────┐ │
│  │ Job Req: "5+ years   │   ──▶  │ System: You are an expert  │ │
│  │ React experience"    │        │ interviewer...             │ │
│  │                      │        │ Context: {job_requirements}│ │
│  │ Job Req: "TypeScript │        │ Response: {transcription}  │ │
│  │ proficiency"         │        │ Task: Evaluate...          │ │
│  └──────────────────────┘        └────────────────────────────┘ │
│                                                   │               │
│                                                   ▼               │
│                           6. Structured Output                   │
│                           ┌────────────────────────────────────┐ │
│                           │ {                                  │ │
│                           │   "score": 85,                     │ │
│                           │   "skills_matched": [...],         │ │
│                           │   "feedback": "...",               │ │
│                           │   "improvement_areas": [...]       │ │
│                           │ }                                  │ │
│                           └────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 3. Embedding Strategy

```yaml
# Using OpenAI embeddings (more stable) or local alternative
EMBEDDING_PROVIDER: openai  # or 'local'
EMBEDDING_MODEL: text-embedding-3-small
EMBEDDING_DIMENSIONS: 1536

# Alternative: Hugging Face local model
# EMBEDDING_MODEL: sentence-transformers/all-MiniLM-L6-v2
# EMBEDDING_DIMENSIONS: 384
```

---

## Kafka Integration

### Subscribed Topics

| Topic | Event | Action |
|-------|-------|--------|
| `interview-events` | `interview.completed` | Trigger analysis pipeline |
| `media-events` | `transcription.ready` | Process transcription |

### Published Topics

| Topic | Event | Trigger |
|-------|-------|---------|
| `analysis-events` | `analysis.completed` | After LLM evaluation |
| `analysis-events` | `analysis.failed` | On processing error |

### Event Schemas

**Incoming: interview.completed**
```json
{
  "eventId": "uuid",
  "eventType": "interview.completed",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "interviewId": "uuid",
    "candidateId": "uuid",
    "templateId": "uuid",
    "responses": [
      {
        "questionId": "uuid",
        "transcriptionUrl": "s3://...",
        "transcriptionText": "...",
        "duration": 120
      }
    ]
  }
}
```

**Outgoing: analysis.completed**
```json
{
  "eventId": "uuid",
  "eventType": "analysis.completed",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "interviewId": "uuid",
    "candidateId": "uuid",
    "overallScore": 85,
    "categoryScores": {
      "technicalSkills": 90,
      "communication": 80,
      "problemSolving": 85
    },
    "feedback": {
      "summary": "...",
      "strengths": ["..."],
      "improvements": ["..."]
    },
    "skillsExtracted": ["React", "TypeScript", "Node.js"]
  }
}
```

---

## Database Schema

### Tables

**analysis_results**
```
┌─────────────────────────────────────────────────────────────────┐
│ analysis_results                                                │
├─────────────────────────────────────────────────────────────────┤
│ id                  UUID PRIMARY KEY                            │
│ interview_id        UUID NOT NULL (FK → interviews)             │
│ candidate_id        UUID NOT NULL                               │
│ template_id         UUID NOT NULL                               │
│ overall_score       INTEGER (0-100)                             │
│ category_scores     JSONB                                       │
│ feedback            JSONB                                       │
│ skills_extracted    TEXT[]                                      │
│ raw_llm_response    TEXT                                        │
│ model_used          VARCHAR(100)                                │
│ tokens_used         INTEGER                                     │
│ processing_time_ms  INTEGER                                     │
│ status              ENUM('pending','processing','completed',    │
│                          'failed')                              │
│ error_message       TEXT                                        │
│ created_at          TIMESTAMP                                   │
│ updated_at          TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────────┘
```

**job_embeddings (pgvector)**
```
┌─────────────────────────────────────────────────────────────────┐
│ job_embeddings                                                  │
├─────────────────────────────────────────────────────────────────┤
│ id                  UUID PRIMARY KEY                            │
│ template_id         UUID NOT NULL (FK → templates)              │
│ chunk_text          TEXT NOT NULL                               │
│ chunk_index         INTEGER                                     │
│ section_type        VARCHAR(50) (requirements, skills, etc)     │
│ embedding           VECTOR(1536)                                │
│ metadata            JSONB                                       │
│ created_at          TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────────┘

-- Index for vector similarity search
CREATE INDEX ON job_embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

**question_analysis**
```
┌─────────────────────────────────────────────────────────────────┐
│ question_analysis                                               │
├─────────────────────────────────────────────────────────────────┤
│ id                  UUID PRIMARY KEY                            │
│ analysis_result_id  UUID NOT NULL (FK → analysis_results)       │
│ question_id         UUID NOT NULL                               │
│ transcription       TEXT                                        │
│ score               INTEGER (0-100)                             │
│ feedback            TEXT                                        │
│ keywords_detected   TEXT[]                                      │
│ sentiment           VARCHAR(20)                                 │
│ confidence          FLOAT                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## LLM Prompt Templates

### System Prompt (Interview Evaluator)

```
You are an expert technical interviewer and HR professional. 
Your task is to objectively evaluate candidate responses based on:
1. Job requirements provided as context
2. Technical accuracy of answers
3. Communication clarity
4. Problem-solving approach

Always provide:
- Numerical scores (0-100)
- Specific feedback with examples
- Actionable improvement suggestions

Be fair, unbiased, and focus on job-relevant criteria only.
```

### Evaluation Prompt Template

```
## Job Requirements Context
{retrieved_job_requirements}

## Interview Question
{question_text}

## Candidate Response (Transcribed)
{transcription}

## Evaluation Task
Analyze this response and provide:

1. **Score** (0-100): Based on relevance to job requirements
2. **Technical Assessment**: Accuracy of technical content
3. **Communication Score**: Clarity and structure
4. **Strengths**: What the candidate did well
5. **Improvements**: Specific areas to develop
6. **Keywords Detected**: Technical terms and skills mentioned

Output as JSON:
{
  "score": number,
  "technicalScore": number,
  "communicationScore": number,
  "strengths": string[],
  "improvements": string[],
  "keywordsDetected": string[],
  "detailedFeedback": string
}
```

---

## API Endpoints

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/analysis/:interviewId` | Get analysis results |
| `GET` | `/api/v1/analysis/:interviewId/questions` | Per-question breakdown |
| `POST` | `/api/v1/analysis/:interviewId/retry` | Retry failed analysis |
| `GET` | `/api/v1/candidates/:id/scores` | Candidate score history |
| `POST` | `/api/v1/compare` | Compare multiple candidates |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/analysis/stats` | Processing statistics |
| `GET` | `/api/v1/admin/analysis/queue` | Queue status |
| `POST` | `/api/v1/admin/embeddings/rebuild` | Rebuild vector index |

---

## Processing Pipeline

### Sequence Diagram

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Kafka  │     │ AI Svc  │     │pgvector │     │  Groq   │     │  Kafka  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │
     │ interview.    │               │               │               │
     │ completed     │               │               │               │
     │──────────────▶│               │               │               │
     │               │               │               │               │
     │               │ Query similar │               │               │
     │               │ job reqs      │               │               │
     │               │──────────────▶│               │               │
     │               │               │               │               │
     │               │◀──────────────│               │               │
     │               │ Top 5 chunks  │               │               │
     │               │               │               │               │
     │               │ Build prompt + analyze        │               │
     │               │──────────────────────────────▶│               │
     │               │               │               │               │
     │               │◀──────────────────────────────│               │
     │               │ Structured response           │               │
     │               │               │               │               │
     │               │ Save to DB    │               │               │
     │               │───────────────│               │               │
     │               │               │               │               │
     │               │                               │ analysis.     │
     │               │                               │ completed     │
     │               │───────────────────────────────────────────────▶│
     │               │               │               │               │
```

---

## Configuration

### Environment Variables

```bash
# Application
PORT=3007
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ai_video_interview_analysis
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Groq API
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_MODEL_PRIMARY=llama-3.3-70b-versatile
GROQ_MODEL_FAST=llama-3.1-8b-instant
GROQ_MAX_TOKENS=4096
GROQ_TEMPERATURE=0.3

# Embeddings (OpenAI or local)
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
EMBEDDING_MODEL=text-embedding-3-small

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=ai-analysis-service
KAFKA_GROUP_ID=ai-analysis-service-group

# Rate Limiting
GROQ_RATE_LIMIT_TOKENS=6000
GROQ_RATE_LIMIT_WINDOW_MS=60000

# Redis (for queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Observability
LOG_LEVEL=debug
LOKI_HOST=http://localhost:3100
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

---

## Error Handling

### Retry Strategy

| Error Type | Retry | Action |
|------------|-------|--------|
| Rate limit (429) | Yes (with backoff) | Queue and retry after reset |
| Timeout | Yes (3 attempts) | Exponential backoff |
| Invalid response | Yes (2 attempts) | Re-prompt with stricter format |
| API error (5xx) | Yes (3 attempts) | Exponential backoff |
| Validation error | No | Log and mark failed |

### Fallback Strategy

```
Primary Model (llama-3.3-70b) 
    ↓ (if rate limited)
Fast Model (llama-3.1-8b)
    ↓ (if both unavailable)
Queue for later processing
```

---

## Metrics & Monitoring

### Prometheus Metrics

```
ai_analysis_requests_total{status="success|failed"}
ai_analysis_processing_duration_seconds
ai_analysis_tokens_used_total
ai_analysis_queue_size
ai_analysis_groq_rate_limit_hits_total
ai_analysis_embedding_requests_total
```

### Health Check

```
GET /health

{
  "status": "ok",
  "groq": "connected",
  "database": "connected",
  "kafka": "connected",
  "queueSize": 5
}
```

---

## Dependencies

### Internal Services
- **Media Service** (3006) - Provides transcriptions
- **Interview Service** (3004) - Source of interview data
- **Notification Service** (3008) - Notifies HR on completion

### External Services
- **Groq API** - LLM inference
- **OpenAI API** - Text embeddings (optional)
- **PostgreSQL + pgvector** - Vector storage
- **Kafka** - Event streaming
- **Redis** - Rate limit queue

---

## Implementation Phases

### Phase 1: Foundation
- [ ] NestJS project setup with Clean Architecture
- [ ] Database schema + pgvector extension
- [ ] Groq API integration with rate limiting
- [ ] Basic Kafka consumer

### Phase 2: RAG Pipeline
- [ ] Embedding service integration
- [ ] Vector search implementation
- [ ] Prompt template system
- [ ] Structured output parsing

### Phase 3: Analysis Features
- [ ] Per-question analysis
- [ ] Overall interview scoring
- [ ] Skills extraction
- [ ] Candidate comparison

### Phase 4: Production Readiness
- [ ] Comprehensive error handling
- [ ] Metrics and monitoring
- [ ] Queue management
- [ ] Performance optimization

---

**Last Updated:** 2025-01-XX
