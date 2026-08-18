import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit/audit-service'
import { createHash } from 'crypto'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value

  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE_NAME)

  if (token) {
    const tokenHash = hashToken(token)
    const session = await db.session.findUnique({ where: { tokenHash }, select: { userId: true } })
    await db.session.deleteMany({ where: { tokenHash } }).catch(() => {})
    if (session) {
      await recordAudit({ userId: session.userId, action: 'LOGOUT', resource: 'Session' })
    }
  }

  return res
}
