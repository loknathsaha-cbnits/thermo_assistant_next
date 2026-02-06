export async function fetchPdfAsBase64(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch PDF");
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer.toString("base64");
}
