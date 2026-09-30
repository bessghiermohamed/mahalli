/** Client-side image compression before uploading to Supabase Storage. */
export async function compressImage(
  file: File,
  maxSide = 1200,
  quality = 0.85
): Promise<Blob> {
  // Fast path for SVG — browsers can't rasterize reliably via canvas anyway.
  if (file.type === "image/svg+xml") return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob && blob.size < file.size ? blob : file),
      "image/jpeg",
      quality
    );
  });
}
