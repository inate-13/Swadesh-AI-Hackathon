import { env } from "@my-better-t-app/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import fs from "fs";
import path from "path";
// @ts-expect-error - no types
import wav from "wav-decoder"
// @ts-expect-error - no types
import WavEncoder from "wav-encoder";
 
import { eq } from "drizzle-orm"

import { db } from "@my-better-t-app/db"
import { chunks } from "@my-better-t-app/db/schema"
const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

 
 
app.post("/upload-chunk", async (c) => {
  const body = await c.req.parseBody()

  const file = body.file as File
  const sessionId = body.sessionId as string
  const chunkIndex = body.chunkIndex as string

  if (!file || !sessionId || !chunkIndex) {
    return c.json({ error: "Missing fields" }, 400)
  }

  try {
    // 1️⃣ Create directory
    const dir = path.join("uploads", sessionId)
    await fs.promises.mkdir(dir, { recursive: true })

    // 2️⃣ Save file
    const filePath = path.join(dir, `chunk-${chunkIndex}.wav`)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.promises.writeFile(filePath, buffer)

    // 3️⃣ DB ACK
    await db.insert(chunks).values({
      sessionId,
      chunkIndex,
      filePath,
      uploaded: "true",
    })

    return c.json({ success: true })
  } catch (err) {
    console.error(err)
    return c.json({ error: "Upload failed" }, 500)
  }
})

app.get("/chunks-status/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId")

  const data = await db
    .select()
    .from(chunks)
    .where(eq(chunks.sessionId, sessionId))

  return c.json(data)
})

app.post("/finalize-session", async (c) => {
  const { sessionId } = await c.req.json()

  if (!sessionId) {
    return c.json({ error: "Missing sessionId" }, 400)
  }

  try {
    const dir = path.join("uploads", sessionId)

    // 1️⃣ Read all chunk files
    const files = await fs.promises.readdir(dir)

    // sort chunks properly
    const sortedFiles = files.sort((a, b) => {
      const ai = parseInt(a.split("-")[1] ?? "0")
      const bi = parseInt(b.split("-")[1] ?? "0")
      return ai - bi
    })

    // 2️⃣ Merge buffers
    const buffers: Buffer[] = []

    for (const file of sortedFiles) {
      const filePath = path.join(dir, file)
      const data = await fs.promises.readFile(filePath)
      buffers.push(data)
    }

    const finalBuffer = Buffer.concat(buffers)

    const finalPath = path.join(dir, "final.wav")
    await fs.promises.writeFile(finalPath, finalBuffer)

    return c.json({
      success: true,
    })
  } catch (err) {
    console.error(err)
    return c.json({ error: "Finalize failed" }, 500)
  }
})
app.post("/transcribe-chunk", async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body.file as File

    if (!file) {
      return c.json({ error: "No file provided" }, 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const formData = new FormData()
    formData.append("file", new Blob([buffer], { type: "audio/wav" }), "chunk.wav")
    formData.append("model", "whisper-1")

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: formData,
    })

    // ✅ CHECK RESPONSE FIRST
    if (!res.ok) {
      const errorText = await res.text()
      console.error("Whisper error response:", errorText)
      return c.json({ error: `Whisper failed: ${res.statusText}` }, 500)
    }

    const data = await res.json() as { text?: string }

    return c.json({ text: data.text || "" })
  } catch (err) {
    console.error("Internal Transcribe Error Details:", err)
    return c.json({ 
      error: "Internal error during transcription",
      message: err instanceof Error ? err.message : String(err)
    }, 500)
  }
})

export default app;