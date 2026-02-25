# Media Service (Planned)

> **STATUS: NOT YET IMPLEMENTED** -- This service is planned but has no code yet. This document describes the intended architecture and serves as a specification for future implementation.

## Overview

Media microservice responsible for video/audio file storage, transcription processing, media streaming, and thumbnail generation. Will handle all binary media operations for the AI Video Interview platform, decoupling media concerns from the Interview Service.

- **Expected Port**: 8004
- **Expected Stack**: NestJS 11, TypeORM, PostgreSQL, Kafka (kafkajs), MinIO (S3-compatible), FFmpeg
- **Architecture**: DDD + CQRS (same patterns as user-service and interview-service)
- **Kafka Topics**: `media-events`, `media-commands`, `media-events-dlq`

## Expected Features

| Feature | Description |
|---------|-------------|
| File upload | Chunked multipart upload of video/audio recordings to MinIO |
| Presigned URLs | Generate time-limited signed URLs for direct browser upload/download |
| Transcription | Process audio through Whisper API (or similar), store transcripts |
| Thumbnail generation | Extract video frame thumbnails via FFmpeg |
| Video processing | Transcode, compress, extract audio tracks from uploaded videos |
| Media streaming | Serve video/audio with range request support for seeking |
| Lifecycle management | Automated cleanup of expired/orphaned media files |

## Expected DDD Structure

```
apps/media-service/
  src/
    domain/
      entities/          # Media, Transcript, Thumbnail
      value-objects/      # FileMetadata, MediaType, TranscriptionStatus
      repositories/       # IMediaRepository, ITranscriptRepository
      events/            # MediaUploadedEvent, TranscriptionCompletedEvent
    application/
      commands/          # UploadMediaCommand, RequestTranscriptionCommand
      queries/           # GetMediaQuery, GetTranscriptQuery
      handlers/          # Command and query handlers
      services/          # MediaApplicationService
    infrastructure/
      persistence/       # TypeORM entities, repositories
      storage/           # MinIO client, S3 adapter
      transcription/     # Whisper API client, async job processing
      ffmpeg/            # FFmpeg wrapper for video/audio processing
      kafka/             # Event consumers and producers
    presentation/
      controllers/       # REST API controllers
      dtos/              # Request/response DTOs
```

## Expected Kafka Integration

- **Consumes**: `interview-events` (interview.completed triggers transcription)
- **Produces**: `media-events` (media.uploaded, transcription.completed, transcription.failed)
- **Consumer group**: `media-service`
- **Partition key**: `mediaId` or `invitationId`

## Expected Environment Variables

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/media_db
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=media
KAFKA_BROKERS=localhost:9092
WHISPER_API_URL=http://localhost:9300
FFMPEG_PATH=/usr/bin/ffmpeg
PORT=8004
```

## Skills & Best Practices

### Video/Audio Processing (FFmpeg)

- **FFmpeg integration**: Wrap FFmpeg as a child process using `fluent-ffmpeg` or direct `child_process.spawn`. Never block the event loop with synchronous FFmpeg calls. Run FFmpeg jobs in a dedicated worker or Bull/BullMQ queue.
- **Chunked uploads**: Accept large video uploads in chunks using multipart upload. Reassemble chunks on the server or use MinIO's native multipart upload API. Set reasonable chunk sizes (5-10 MB) to balance memory usage and upload reliability.
- **Streaming processing**: Pipe FFmpeg input/output using Node.js streams. For transcoding, read from MinIO stream and write back to MinIO stream without loading the entire file into memory.
- **Format handling**: Accept common formats (MP4, WebM, MKV for video; WAV, MP3, OGG, WebM for audio). Normalize to a standard format (H.264 MP4 for video, AAC for audio) for consistent playback.
- **Thumbnail extraction**: Extract frames at specific timestamps using `ffmpeg -ss <time> -vframes 1`. Generate multiple thumbnail candidates and pick the best one (highest contrast, no black frames). Store thumbnails in a separate MinIO bucket or prefix for CDN-friendly caching.
- **Resource limits**: Set FFmpeg process limits (max concurrent jobs, memory caps, timeout per job). Monitor FFmpeg process health and kill hung processes. Log processing duration and output size for capacity planning.
- **Error recovery**: FFmpeg can fail silently on corrupt input. Always check exit codes and stderr output. Implement retry with exponential backoff for transient failures. Send corrupt/unprocessable files to a dead letter queue for manual review.

### S3/MinIO Best Practices

- **Multipart upload**: Use MinIO's `putObject` with streaming for files under 100MB. For larger files, use `initiateMultipartUpload` + `uploadPart` + `completeMultipartUpload`. This enables resumable uploads and reduces memory pressure.
- **Presigned URLs**: Generate presigned PUT URLs for direct browser-to-MinIO uploads (bypasses the application server). Set short TTLs (5-15 minutes). Include content-type and content-length constraints in the presigned policy to prevent abuse. Generate presigned GET URLs for media playback with appropriate TTLs.
- **Lifecycle policies**: Configure MinIO lifecycle rules to automatically delete temporary/incomplete uploads after 24 hours. Move completed interview media to a cheaper storage tier (or compress) after 90 days. Delete orphaned files that have no database reference.
- **Bucket organization**: Use path-based prefixes for logical separation: `recordings/{invitationId}/video.webm`, `thumbnails/{invitationId}/thumb.jpg`, `transcripts/{invitationId}/transcript.json`. This enables prefix-based listing and targeted lifecycle policies.
- **Connection pooling**: Reuse the MinIO client instance across the application. Configure appropriate timeout and retry settings. Handle `SlowDown` responses with backoff.
- **Data integrity**: Compute and verify MD5/SHA256 checksums on upload. Store checksums in the database. Periodically audit stored files against database records to detect corruption or orphaned objects.

### Transcription Integration

- **Whisper API integration**: Send audio files to Whisper API (self-hosted or cloud) for speech-to-text. Extract audio track from video first using FFmpeg before sending to transcription. Send audio in WAV format for best transcription quality.
- **Async processing**: Transcription is a long-running operation (minutes per recording). Use a job queue (BullMQ with Redis) to process transcriptions asynchronously. Publish `transcription.completed` or `transcription.failed` Kafka events when done.
- **Webhooks/polling**: If using a cloud transcription API with webhooks, expose a webhook endpoint to receive completion notifications. If polling, use exponential backoff to check job status.
- **Transcript format**: Store transcripts as structured JSON with timestamps per segment (start, end, text, confidence score). This enables features like timestamp-linked playback, search within transcript, and AI analysis with temporal context.
- **Language detection**: Auto-detect the spoken language or accept a language hint from the interview metadata. Pass the language to the transcription API for better accuracy.
- **Cost management**: Transcription APIs charge per audio minute. Track usage per tenant/interview. Cache transcription results -- never re-transcribe the same audio. Consider quality tiers (fast/draft vs. accurate/final) based on use case.

### NestJS Patterns (Media Service Specific)

- **BullMQ for processing pipeline**: Use separate BullMQ queues for each processing stage: `upload-queue`, `transcode-queue`, `thumbnail-queue`, `transcription-queue`. This allows independent scaling and monitoring of each stage. Use `FlowProducer` to chain dependent jobs (upload → transcode → thumbnail + transcription in parallel).
- **Streaming responses**: For video playback, support HTTP Range requests (`206 Partial Content`). Use Node.js streams to pipe from MinIO to the response without loading the full file in memory. Set `Accept-Ranges: bytes` and `Content-Range` headers correctly.
- **File type validation**: Validate file types on upload via magic bytes (file signature), not just file extension or MIME type. Use the `file-type` npm package to detect actual format. Reject files that don't match expected types (video/audio only). This prevents uploading malicious files disguised as media.
- **Progress tracking**: For long-running operations (transcoding, transcription), store progress in Redis with TTL. Expose a `GET /media/:id/status` endpoint that returns `{ status, progress: 0-100, estimatedTimeRemaining }`. Frontend polls this or uses SSE.

### Kafka Integration (Media Service Specific)

- **Event-driven processing**: The media service consumes `interview-events` (specifically `response.submitted`) to initiate media processing. It doesn't expose endpoints for upload initiation — instead, the interview service triggers it via events. This ensures media processing only happens for valid interview responses.
- **Event publishing**: Publish `media.uploaded`, `media.processed`, `transcription.completed`, `transcription.failed` to `media-events` topic. The AI Analysis Service may consume `transcription.completed` to enhance analysis with transcript data in a future iteration.
- **Partition key**: Use `invitationId` as the partition key for media events. This ensures all media events for a single interview session are processed in order (upload → process → transcribe).

### Resource Management

- **Memory limits**: FFmpeg and MinIO streams can consume significant memory. Set per-job memory limits: max 500MB per transcoding job, max 200MB per upload. Monitor Node.js heap usage and trigger GC pressure alerts at 80% of container memory limit.
- **Disk space**: Temporary files during FFmpeg processing can be large. Use a dedicated temp directory with periodic cleanup. Set `TMPDIR` to a volume with sufficient space. Clean up temp files in a `finally` block to prevent leaks.
- **Concurrent processing**: Limit concurrent FFmpeg processes to prevent CPU starvation. Use BullMQ `concurrency` setting: 2-4 for transcoding (CPU-heavy), 5-10 for uploads (I/O-heavy), 2 for transcription API calls (rate-limited).
