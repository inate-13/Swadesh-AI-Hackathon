export async function saveChunkToOPFS(
  sessionId: string,
  index: number,
  blob: Blob
) {
  const root = await navigator.storage.getDirectory()

  const dir = await root.getDirectoryHandle(sessionId, {
    create: true,
  })

  const fileHandle = await dir.getFileHandle(
    `chunk-${index}.wav`,
    { create: true }
  )

  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}