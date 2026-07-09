import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'
import { ADMIN_ROLES } from '@/lib/rbac/permissions'
import { changeStaffRole, revokeStaffAccess } from '@/lib/rbac/staff-service'
import { recordAudit, requestMetadata } from '@/lib/audit/audit-service'

const updateSchema = z.object({ role: z.enum(ADMIN_ROLES as [string, ...string[]]) })

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, allowed } = await requirePermission('staff', 'write')
  if (!allowed || !session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid role.' }, { status: 400 })

  if (id === session.user.id) {
    return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 400 })
  }

  const before = await db.user.findUnique({ where: { id }, select: { role: true } })
  if (!before) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  const staff = await changeStaffRole(id, parsed.data.role as never)

  const { ipAddress, userAgent } = requestMetadata(req)
  await recordAudit({
    userId: session.user.id,
    action: 'ROLE_CHANGE',
    resource: 'StaffAccount',
    resourceId: id,
    before: { role: before.role },
    after: { role: staff.role },
    ipAddress,
    userAgent,
  })

  return NextResponse.json({ staff })
}

/** Revokes admin access — demotes to CUSTOMER, never deletes the account (see staff-service.ts). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, allowed } = await requirePermission('staff', 'write')
  if (!allowed || !session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  if (id === session.user.id) {
    return NextResponse.json({ error: 'You cannot revoke your own access.' }, { status: 400 })
  }

  const before = await db.user.findUnique({ where: { id }, select: { role: true } })
  if (!before) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  await revokeStaffAccess(id)

  const { ipAddress, userAgent } = requestMetadata(req)
  await recordAudit({
    userId: session.user.id,
    action: 'ROLE_CHANGE',
    resource: 'StaffAccount',
    resourceId: id,
    before: { role: before.role },
    after: { role: 'CUSTOMER' },
    ipAddress,
    userAgent,
  })

  return NextResponse.json({ success: true })
}
