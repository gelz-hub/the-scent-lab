import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { markRead } from '@/lib/notification-center/service'

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  await markRead(session.user.id, id)
  return NextResponse.json({ ok: true })
}
