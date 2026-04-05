import { saveChunkToOPFS } from "./opfs"
import { uploadChunk } from "./upload"
import type { WavChunk } from "@/hooks/use-recorder"

export async function processChunk(
  chunk: WavChunk,
  sessionId: string,
  index: number
) {
  try {
    // 1. Save to OPFS
    await saveChunkToOPFS(sessionId, index, chunk.blob)

    // 2. Upload to backend (ACK)
    await uploadChunk(chunk.blob, sessionId, index)

    // 3. Transcribe chunk (REAL API)
    const formData = new FormData()
    formData.append("file", chunk.blob)

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/transcribe-chunk`,
      {
        method: "POST",
        body: formData,
      }
    )

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`)
    }

    const data = await res.json() as { text?: string }

    return data.text || ""
  } catch (error) {
    console.error("Error processing chunk:", error)
    return "[Error transcribing chunk]"
  }
}