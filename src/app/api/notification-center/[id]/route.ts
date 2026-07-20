import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { markRead } from '@/lib/notification-center/service'

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  await markRead(session.user.id, id)
  return NextResponse.json({ ok: true })
}
