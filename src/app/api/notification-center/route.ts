import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { listNotifications, unreadCount, markAllRead } from '@/lib/notification-center/service'

export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const [notifications, unread] = await Promise.all([
    listNotifications(session.user.id),
    unreadCount(session.user.id),
  ])

  return NextResponse.json({ notifications, unreadCount: unread })
}

/** Marks every notification for the current user as read. */
export async function PATCH() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  await markAllRead(session.user.id)
  return NextResponse.json({ ok: true })
}
