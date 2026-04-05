export async function uploadChunk(
  blob: Blob,
  sessionId: string,
  index: number
) {
  const formData = new FormData()
  formData.append("file", blob)
  formData.append("sessionId", sessionId)
  formData.append("chunkIndex", index.toString())

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/upload-chunk`,
      {
        method: "POST",
        body: formData,
      }
    )

    if (!res.ok) throw new Error("Upload failed")

    console.log("ACK:", index)
  } catch (err) {
    console.log("Retrying:", index)

    setTimeout(() => {
      uploadChunk(blob, sessionId, index).catch(() => {
        // Error already handled in catch block of uploadChunk,
        // but we catch here to avoid unhandled rejection warning.
      })
    }, 3000)
  }
}