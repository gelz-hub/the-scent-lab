import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { cloudinary } from '@/lib/cloudinary'
import { updateProfile } from '@/lib/account/customer-service'
import { sniffImageType } from '@/lib/security/image-sniff'

const MAX_BYTES = 8 * 1024 * 1024 // 8MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

/** Customer-facing avatar upload â€” separate from the staff-only /api/upload (product images), same Cloudinary publicId+url storage pattern (never store only a URL). */
export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    return NextResponse.json({ error: 'Image storage is not configured yet.' }, { status: 503 })
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP or AVIF images are allowed.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be smaller than 8MB.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Client-supplied file.type is just a label â€” verify the actual bytes so a
  // renamed non-image file can't be smuggled through to Cloudinary.
  if (!sniffImageType(buffer)) {
    return NextResponse.json({ error: 'File content does not match a supported image format.' }, { status: 400 })
  }

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'the-scent-lab/avatars', public_id: session.user.id, overwrite: true },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve(result as { secure_url: string; public_id: string })
      }
    )
    uploadStream.end(buffer)
  }).catch((error) => {
    console.error('[account] avatar upload failed', error)
    return null
  })

  if (!result) return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })

  const profile = await updateProfile(session.user.id, {
    avatarPublicId: result.public_id,
    avatarUrl: result.secure_url,
  })

  return NextResponse.json({ profile })
}
