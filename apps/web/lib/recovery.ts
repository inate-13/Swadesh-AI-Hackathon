import { uploadChunk } from "./upload"

export async function recoverChunks(sessionId: string) {
  const root = await navigator.storage.getDirectory()

  try {
    const dir = await root.getDirectoryHandle(sessionId)

    for await (const [name, handle] of (dir as any).entries()) {
      const file = await handle.getFile()

      const index = parseInt(name.split("-")[1])

      await uploadChunk(file, sessionId, index)
    }
  } catch {
    console.log("No previous session found")
  }
}