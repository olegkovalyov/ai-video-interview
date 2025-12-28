# Media Service

**Status:** 🟡 Partially Implemented  
**Port:** 3006  
**Technology Stack:** NestJS, TypeORM, PostgreSQL, MinIO/S3, FFmpeg, Groq Whisper API  
**Priority:** HIGH (Core functionality)

---

## Overview

Media Service handles all media file operations for the AI Video Interview platform including storage, processing, transcription, and streaming of videos, images, and documents.

**Key Capabilities:**
- File upload and storage (MinIO/S3)
- Video/audio transcription (Groq Whisper API)
- Video processing (FFmpeg)
- Thumbnail generation
- Presigned URL generation
- CDN integration for streaming

---

## Supported File Types

### By Category

| Category | Extensions | Max Size | Storage Bucket |
|----------|------------|----------|----------------|
| **Video** | mp4, webm, mov, avi | 500 MB | `videos` |
| **Audio** | mp3, wav, m4a, ogg | 100 MB | `audio` |
| **Images** | jpg, jpeg, png, gif, webp | 10 MB | `images` |
| **Documents** | pdf | 50 MB | `documents` |
| **Avatars** | jpg, jpeg, png | 5 MB | `avatars` |

### File Type Mapping

```yaml
file_types:
  video_response:
    bucket: videos
    allowed: [mp4, webm]
    max_size: 500MB
    process: [transcode, thumbnail, transcribe]
    
  question_image:
    bucket: images
    allowed: [jpg, jpeg, png, gif, webp]
    max_size: 10MB
    process: [resize, optimize]
    
  avatar:
    bucket: avatars
    allowed: [jpg, jpeg, png]
    max_size: 5MB
    process: [resize, crop_square]
    
  interview_attachment:
    bucket: documents
    allowed: [pdf]
    max_size: 50MB
    process: [thumbnail_pdf]
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   MEDIA SERVICE (3006)                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  HTTP Layer                                │ │
│  │  - UploadController (presigned URLs)                      │ │
│  │  - MediaController (metadata, streaming)                  │ │
│  │  - TranscriptionController                                │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │              Application Layer (CQRS)                      │ │
│  │  Commands:                    Queries:                     │ │
│  │  - InitiateUpload             - GetMediaById               │ │
│  │  - ConfirmUpload              - GetStreamUrl               │ │
│  │  - ProcessMedia               - GetTranscription           │ │
│  │  - TranscribeMedia            - ListMediaByOwner           │ │
│  │  - DeleteMedia                                             │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │              Processing Pipeline                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │   FFmpeg    │  │  Thumbnail  │  │  Whisper    │       │ │
│  │  │  Processor  │  │  Generator  │  │ Transcriber │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │              Infrastructure Layer                          │ │
│  │  - MinioStorageService                                     │ │
│  │  - GroqWhisperService                                      │ │
│  │  - FFmpegService                                           │ │
│  │  - MediaRepository                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    MinIO/S3       PostgreSQL       Groq API       Kafka
   (storage)       (metadata)      (Whisper)      (events)
```

---

## Upload Flow

### Direct Upload with Presigned URLs

```
┌─────────────────────────────────────────────────────────────────┐
│                  Direct Upload Flow                             │
│                                                                 │
│  1. Client requests presigned URL                              │
│     POST /api/v1/media/upload/initiate                         │
│     {                                                          │
│       "fileName": "response.webm",                             │
│       "fileType": "video_response",                            │
│       "contentType": "video/webm",                             │
│       "fileSize": 15000000                                     │
│     }                                                          │
│     │                                                          │
│     ▼                                                          │
│  2. Media Service validates & creates presigned URL            │
│     - Check file type allowed                                  │
│     - Check size within limits                                 │
│     - Generate unique file key                                 │
│     - Create presigned PUT URL (15 min expiry)                 │
│     - Create pending media record                              │
│     │                                                          │
│     ▼                                                          │
│  3. Return to client                                           │
│     {                                                          │
│       "mediaId": "uuid",                                       │
│       "uploadUrl": "https://minio/bucket/key?signature=...",   │
│       "expiresAt": "2025-01-01T00:15:00Z"                     │
│     }                                                          │
│     │                                                          │
│     ▼                                                          │
│  4. Client uploads directly to MinIO/S3                        │
│     PUT {uploadUrl}                                            │
│     Content-Type: video/webm                                   │
│     Body: <file binary>                                        │
│     │                                                          │
│     ▼                                                          │
│  5. Client confirms upload                                     │
│     POST /api/v1/media/upload/confirm                          │
│     { "mediaId": "uuid" }                                      │
│     │                                                          │
│     ▼                                                          │
│  6. Media Service verifies & starts processing                 │
│     - Verify file exists in storage                            │
│     - Update status: pending → processing                      │
│     - Queue processing jobs (FFmpeg, transcription)            │
│     - Publish media.uploaded event                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Video Processing Pipeline

### FFmpeg Processing

```
┌─────────────────────────────────────────────────────────────────┐
│                  Video Processing Pipeline                      │
│                                                                 │
│  Input: response.webm (raw browser recording)                  │
│     │                                                          │
│     ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Step 1: Extract Metadata                                │   │
│  │ ffprobe -v quiet -print_format json -show_format        │   │
│  │         -show_streams input.webm                        │   │
│  │                                                          │   │
│  │ Output: duration, resolution, codec, bitrate            │   │
│  └─────────────────────────────────────────────────────────┘   │
│     │                                                          │
│     ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Step 2: Transcode to MP4 (H.264)                        │   │
│  │ ffmpeg -i input.webm -c:v libx264 -preset medium        │   │
│  │        -crf 23 -c:a aac -b:a 128k output.mp4            │   │
│  │                                                          │   │
│  │ Output: optimized MP4 for streaming                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│     │                                                          │
│     ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Step 3: Generate Thumbnail                              │   │
│  │ ffmpeg -i output.mp4 -ss 00:00:01 -vframes 1            │   │
│  │        -vf scale=320:-1 thumbnail.jpg                   │   │
│  │                                                          │   │
│  │ Output: 320px wide thumbnail                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│     │                                                          │
│     ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Step 4: Extract Audio for Transcription                 │   │
│  │ ffmpeg -i output.mp4 -vn -acodec pcm_s16le              │   │
│  │        -ar 16000 -ac 1 audio.wav                        │   │
│  │                                                          │   │
│  │ Output: 16kHz mono WAV for Whisper                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│     │                                                          │
│     ▼                                                          │
│  Upload processed files to MinIO                               │
│  Update media record with URLs                                 │
│  Publish media.processed event                                 │
└─────────────────────────────────────────────────────────────────┘
```

### FFmpeg Configuration

```yaml
ffmpeg_profiles:
  video_response:
    transcode:
      codec: libx264
      preset: medium
      crf: 23
      audio_codec: aac
      audio_bitrate: 128k
      output_format: mp4
    thumbnail:
      time_offset: 1s
      width: 320
      format: jpg
    audio_extract:
      sample_rate: 16000
      channels: 1
      format: wav
      
  avatar:
    resize:
      width: 256
      height: 256
      crop: center
      format: jpg
      quality: 85
      
  question_image:
    resize:
      max_width: 1920
      max_height: 1080
      format: webp
      quality: 80
```

---

## Transcription (Groq Whisper)

### Whisper Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                  Transcription Flow                             │
│                                                                 │
│  1. Audio extracted from video (WAV 16kHz)                     │
│     │                                                          │
│     ▼                                                          │
│  2. Check audio duration                                       │
│     - If > 25 MB: chunk into segments                          │
│     - If ≤ 25 MB: single request                               │
│     │                                                          │
│     ▼                                                          │
│  3. Send to Groq Whisper API                                   │
│     POST https://api.groq.com/openai/v1/audio/transcriptions  │
│     - model: whisper-large-v3-turbo                            │
│     - file: audio.wav                                          │
│     - language: auto-detect                                    │
│     - response_format: verbose_json                            │
│     │                                                          │
│     ▼                                                          │
│  4. Process response                                           │
│     {                                                          │
│       "text": "Full transcription...",                         │
│       "segments": [                                            │
│         {                                                      │
│           "start": 0.0,                                        │
│           "end": 2.5,                                          │
│           "text": "Hello, my name is..."                       │
│         }                                                      │
│       ],                                                       │
│       "language": "en"                                         │
│     }                                                          │
│     │                                                          │
│     ▼                                                          │
│  5. Store transcription                                        │
│     - Save to transcriptions table                             │
│     - Link to media record                                     │
│     │                                                          │
│     ▼                                                          │
│  6. Publish transcription.ready event                          │
│     → AI Analysis Service consumes                             │
└─────────────────────────────────────────────────────────────────┘
```

### Whisper Models Comparison

| Model | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| `whisper-large-v3` | Slower | Best | Final analysis |
| `whisper-large-v3-turbo` | Faster | Good | Real-time, high volume |

### Rate Limiting

```yaml
groq_whisper:
  model: whisper-large-v3-turbo
  max_file_size: 25MB
  rate_limit:
    requests_per_minute: 20
    audio_seconds_per_day: 28800  # 8 hours
  retry:
    max_attempts: 3
    backoff: exponential
```

---

## MinIO/S3 Storage

### Bucket Structure

```
minio/
├── videos/
│   ├── raw/
│   │   └── {userId}/{mediaId}/original.webm
│   └── processed/
│       └── {userId}/{mediaId}/
│           ├── video.mp4
│           ├── thumbnail.jpg
│           └── audio.wav
│
├── images/
│   └── {userId}/{mediaId}/
│       ├── original.{ext}
│       └── optimized.webp
│
├── avatars/
│   └── {userId}/
│       └── avatar.jpg
│
├── documents/
│   └── {userId}/{mediaId}/
│       ├── original.pdf
│       └── thumbnail.jpg
│
└── transcriptions/
    └── {mediaId}/
        └── transcription.json
```

### Bucket Policies

```json
{
  "videos": {
    "lifecycle": {
      "raw_files": "delete_after_7_days",
      "processed_files": "keep_until_deleted"
    },
    "access": "private",
    "versioning": false
  },
  "avatars": {
    "lifecycle": "keep_until_deleted",
    "access": "public_read",
    "cache_control": "max-age=31536000"
  }
}
```

### MinIO Configuration

```yaml
minio:
  endpoint: localhost:9000
  access_key: ${MINIO_ACCESS_KEY}
  secret_key: ${MINIO_SECRET_KEY}
  use_ssl: false
  
  buckets:
    - name: videos
      region: us-east-1
    - name: images
      region: us-east-1
    - name: avatars
      region: us-east-1
      public: true
    - name: documents
      region: us-east-1
    - name: transcriptions
      region: us-east-1
      
  presigned_url:
    upload_expiry: 15m
    download_expiry: 1h
```

---

## Kafka Integration

### Subscribed Topics

| Topic | Event | Action |
|-------|-------|--------|
| `interview-events` | `response.submitted` | Process video response |
| `user-events` | `user.deleted` | Delete user's media |

### Published Topics

| Topic | Event | Trigger |
|-------|-------|---------|
| `media-events` | `media.uploaded` | Upload confirmed |
| `media-events` | `media.processed` | Processing complete |
| `media-events` | `transcription.ready` | Transcription complete |
| `media-events` | `media.deleted` | File deleted |
| `media-events` | `media.processing_failed` | Error occurred |

### Event Schemas

**media.uploaded**
```json
{
  "eventId": "uuid",
  "eventType": "media.uploaded",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "mediaId": "uuid",
    "userId": "uuid",
    "fileType": "video_response",
    "fileName": "response.webm",
    "fileSize": 15000000,
    "contentType": "video/webm",
    "bucket": "videos",
    "key": "raw/{userId}/{mediaId}/original.webm"
  }
}
```

**transcription.ready**
```json
{
  "eventId": "uuid",
  "eventType": "transcription.ready",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "mediaId": "uuid",
    "interviewId": "uuid",
    "questionId": "uuid",
    "transcription": {
      "text": "Full transcription text...",
      "language": "en",
      "duration": 120.5,
      "segments": [...]
    },
    "transcriptionUrl": "s3://transcriptions/{mediaId}/transcription.json"
  }
}
```

---

## Database Schema

### Tables

**media_files**
```
┌─────────────────────────────────────────────────────────────────┐
│ media_files                                                     │
├─────────────────────────────────────────────────────────────────┤
│ id                      UUID PRIMARY KEY                        │
│ user_id                 UUID NOT NULL (FK → users)              │
│ file_type               VARCHAR(50) NOT NULL                    │
│ original_name           VARCHAR(255) NOT NULL                   │
│ content_type            VARCHAR(100) NOT NULL                   │
│ file_size               BIGINT NOT NULL                         │
│ bucket                  VARCHAR(100) NOT NULL                   │
│ storage_key             VARCHAR(500) NOT NULL                   │
│ status                  ENUM('pending','uploading','processing',│
│                              'ready','failed','deleted')        │
│ metadata                JSONB                                   │
│   - duration (for video/audio)                                  │
│   - width, height (for video/images)                            │
│   - codec, bitrate                                              │
│ processed_urls          JSONB                                   │
│   - video_url                                                   │
│   - thumbnail_url                                               │
│   - audio_url                                                   │
│ error_message           TEXT                                    │
│ created_at              TIMESTAMP                               │
│ updated_at              TIMESTAMP                               │
│ deleted_at              TIMESTAMP                               │
└─────────────────────────────────────────────────────────────────┘
```

**transcriptions**
```
┌─────────────────────────────────────────────────────────────────┐
│ transcriptions                                                  │
├─────────────────────────────────────────────────────────────────┤
│ id                      UUID PRIMARY KEY                        │
│ media_id                UUID NOT NULL (FK → media_files)        │
│ full_text               TEXT NOT NULL                           │
│ language                VARCHAR(10)                             │
│ duration_seconds        FLOAT                                   │
│ segments                JSONB                                   │
│   - Array of { start, end, text }                              │
│ model_used              VARCHAR(50)                             │
│ confidence              FLOAT                                   │
│ storage_url             TEXT                                    │
│ created_at              TIMESTAMP                               │
└─────────────────────────────────────────────────────────────────┘
```

**processing_jobs**
```
┌─────────────────────────────────────────────────────────────────┐
│ processing_jobs                                                 │
├─────────────────────────────────────────────────────────────────┤
│ id                      UUID PRIMARY KEY                        │
│ media_id                UUID NOT NULL (FK → media_files)        │
│ job_type                ENUM('transcode','thumbnail',           │
│                              'transcribe','optimize')           │
│ status                  ENUM('pending','running','completed',   │
│                              'failed')                          │
│ progress                INTEGER (0-100)                         │
│ started_at              TIMESTAMP                               │
│ completed_at            TIMESTAMP                               │
│ error_message           TEXT                                    │
│ retry_count             INTEGER DEFAULT 0                       │
│ created_at              TIMESTAMP                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/media/upload/initiate` | Get presigned upload URL |
| `POST` | `/api/v1/media/upload/confirm` | Confirm upload complete |
| `POST` | `/api/v1/media/upload/abort` | Abort upload |

### Media Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/media/:id` | Get media metadata |
| `GET` | `/api/v1/media/:id/stream` | Get streaming URL |
| `GET` | `/api/v1/media/:id/download` | Get download URL |
| `DELETE` | `/api/v1/media/:id` | Delete media file |
| `GET` | `/api/v1/media` | List user's media |

### Transcription

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/media/:id/transcription` | Get transcription |
| `POST` | `/api/v1/media/:id/transcribe` | Trigger transcription |

### Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/media/:id/status` | Get processing status |
| `POST` | `/api/v1/media/:id/reprocess` | Retry failed processing |

---

## Configuration

### Environment Variables

```bash
# Application
PORT=3006
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ai_video_interview_media
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false
MINIO_BUCKET_VIDEOS=videos
MINIO_BUCKET_IMAGES=images
MINIO_BUCKET_AVATARS=avatars
MINIO_BUCKET_DOCUMENTS=documents

# Groq (Whisper)
GROQ_API_KEY=gsk_xxxxxxxxxxxx
WHISPER_MODEL=whisper-large-v3-turbo

# FFmpeg
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
FFMPEG_THREADS=2

# Processing
MAX_CONCURRENT_JOBS=4
JOB_TIMEOUT_MS=300000

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=media-service
KAFKA_GROUP_ID=media-service-group

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Observability
LOG_LEVEL=debug
LOKI_HOST=http://localhost:3100
```

---

## Processing Queue (BullMQ)

### Queue Configuration

```yaml
queues:
  media-processing:
    concurrency: 4
    limiter:
      max: 10
      duration: 1000
    defaultJobOptions:
      attempts: 3
      backoff:
        type: exponential
        delay: 5000
      removeOnComplete: 100
      removeOnFail: 50
      
  transcription:
    concurrency: 2
    limiter:
      max: 20
      duration: 60000  # Groq rate limit
    defaultJobOptions:
      attempts: 3
      timeout: 300000
```

### Job Types

```typescript
enum JobType {
  TRANSCODE = 'transcode',
  THUMBNAIL = 'thumbnail',
  EXTRACT_AUDIO = 'extract_audio',
  TRANSCRIBE = 'transcribe',
  OPTIMIZE_IMAGE = 'optimize_image',
  CLEANUP = 'cleanup'
}
```

---

## Metrics & Monitoring

### Prometheus Metrics

```
media_uploads_total{type="video|image|document",status="success|failed"}
media_processing_duration_seconds{job_type="transcode|thumbnail|transcribe"}
media_storage_bytes_total{bucket="videos|images|avatars"}
media_transcription_requests_total{model="whisper-large-v3-turbo"}
media_processing_queue_size{queue="media-processing|transcription"}
```

### Health Check

```
GET /health

{
  "status": "ok",
  "minio": "connected",
  "database": "connected",
  "groq": "connected",
  "queues": {
    "media-processing": { "waiting": 5, "active": 2 },
    "transcription": { "waiting": 3, "active": 1 }
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Current)
- [x] Basic MinIO integration
- [x] Presigned URL generation
- [x] Avatar upload/storage
- [ ] Complete media metadata tracking

### Phase 2: Video Processing
- [ ] FFmpeg integration
- [ ] Video transcoding pipeline
- [ ] Thumbnail generation
- [ ] BullMQ job processing

### Phase 3: Transcription
- [ ] Groq Whisper integration
- [ ] Audio extraction
- [ ] Transcription storage
- [ ] Event publishing

### Phase 4: Production
- [ ] CDN integration
- [ ] Streaming optimization
- [ ] Cleanup jobs
- [ ] Metrics & monitoring

---

**Last Updated:** 2025-01-XX
