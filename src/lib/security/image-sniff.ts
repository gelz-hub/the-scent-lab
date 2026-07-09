// Verifies an uploaded image's real format from its byte signature, since the
// client-supplied File.type / filename extension is just a label the caller
// chose and is trivial to spoof (e.g. renaming a .php file to .png). Both
// upload routes (product images, avatars) check the actual bytes with this
// before ever handing the buffer to Cloudinary. See src/lib/security/README.md,
// "File upload validation".

export type SniffedImageType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'

function matches(buffer: Buffer, offset: number, bytes: number[]): boolean {
  if (buffer.length < offset + bytes.length) return false
  return bytes.every((b, i) => buffer[offset + i] === b)
}

/** Returns the sniffed MIME type from magic bytes, or null if the buffer isn't a recognized image format. */
export function sniffImageType(buffer: Buffer): SniffedImageType | null {
  if (matches(buffer, 0, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (matches(buffer, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (matches(buffer, 0, [0x52, 0x49, 0x46, 0x46]) && matches(buffer, 8, [0x57, 0x45, 0x42, 0x50])) return 'image/webp'
  // AVIF: ISO base media file, 'ftyp' box at offset 4 with an avif/avis brand.
  if (
    matches(buffer, 4, [0x66, 0x74, 0x79, 0x70]) &&
    (matches(buffer, 8, [0x61, 0x76, 0x69, 0x66]) || matches(buffer, 8, [0x61, 0x76, 0x69, 0x73]))
  ) {
    return 'image/avif'
  }
  return null
}
