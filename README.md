
# Project Setup and Run Guide by Sagar

## Overview

This application provides:

* Audio recording in browser
* Chunking and storage using OPFS
* Reliable upload with retry
* Backend storage and DB acknowledgment
* Chunk-level transcription (real-time)
* Final merged transcription with speaker labels

---

# Prerequisites

Install the following:

* Node.js (v18+ recommended)
* Docker (for Postgres)
* Bun (required for server)

Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

---

# 1. Clone and Install

```bash
git clone <repo-url>
cd Swadesh-AI-Hackathon
npm install
```

---

# 2. Start Database (Docker)

Use the provided docker-compose:

```bash
docker compose up -d
```

This starts Postgres on port **5433**.

---

# 3. Environment Variables

## Server

Create file:

```
apps/server/.env
```

Add:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/my-better-t-app
CORS_ORIGIN=http://localhost:3001
OPENAI_API_KEY=your_openai_api_key
```

---

## Web

Create file:

```
apps/web/.env
```

Add:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

---

# 4. Database Setup (Drizzle)

Create config file at root:

```
drizzle.config.ts
```

```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./packages/db/src/schema/index.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

---

Run migration:

```bash
npx drizzle-kit push
```

---

# 5. Install Required Backend Dependencies

```bash
npm install wav-decoder wav-encoder
```

---

# 6. Create Local Storage Folder

At project root:

```bash
mkdir uploads
```

This acts as the local bucket.

---

# 7. Run Application

```bash
npm run dev
```

Expected:

* Server: [http://localhost:3000](http://localhost:3000)
* Web: [http://localhost:3001](http://localhost:3001)

---

# 8. How It Works

## Recording Flow

1. User records audio
2. Audio is chunked (5 seconds)
3. Each chunk is saved to OPFS (browser storage)
4. Chunk is uploaded to backend
5. Backend saves file and writes DB acknowledgment
6. If upload fails, retry is triggered

---

## Transcription Flow

### Chunk-level

* Each chunk is sent to `/transcribe-chunk`
* Whisper API returns text
* Text is displayed in UI

---

### Final transcription

* `/finalize-session` merges all chunks
* Audio is re-encoded properly
* Whisper processes full audio
* Response includes speaker labels

---

# 9. APIs

## Upload Chunk

```
POST /upload-chunk
```

FormData:

* file
* sessionId
* chunkIndex

---

## Transcribe Chunk

```
POST /transcribe-chunk
```

FormData:

* file

---

## Finalize Session

```
POST /finalize-session
```

Body:

```json
{
  "sessionId": "session-xxxx"
}
```

---

# 10. Important Notes

* OPFS ensures no data loss on refresh or network failure
* Database tracks uploaded chunks (ACK system)
* Retry logic ensures eventual consistency
* Final transcription improves accuracy over chunk-level

---

# 11. Common Issues i faced

## Bun not found

Fix PATH or reinstall Bun

---

## Database connection fails

Check:

* Docker is running
* Port is 5433
* DATABASE_URL is correct

---

## Whisper API error

Check:

* OPENAI_API_KEY is valid
* Audio is not empty

---

## CORS issues

Ensure:

```
CORS_ORIGIN=http://localhost:3001
```

---

# 12. Final System Summary

* Reliable chunk-based ingestion
* Client-side durability using OPFS
* Backend acknowledgment with DB
* Retry and recovery support
* Real-time transcription
* Final merged transcription

---

 