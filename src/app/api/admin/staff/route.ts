import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/rbac/require-permission'
import { ADMIN_ROLES, type AdminRole } from '@/lib/rbac/permissions'
import { listStaff, createStaffAccount } from '@/lib/rbac/staff-service'
import { recordAudit, requestMetadata } from '@/lib/audit/audit-service'

export async function GET() {
  const { allowed } = await requirePermission('staff', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  return NextResponse.json({ staff: await listStaff() })
}

const createSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.enum(ADMIN_ROLES as [string, ...string[]]),
})

export async function POST(req: Request) {
  const { session, allowed } = await requirePermission('staff', 'write')
  if (!allowed || !session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 })

  const staff = await createStaffAccount(parsed.data as typeof parsed.data & { role: AdminRole }).catch((e) => {
    console.error('[admin/staff] create failed', e)
    return null
  })
  if (!staff) return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 })

  const { ipAddress, userAgent } = requestMetadata(req)
  await recordAudit({
    userId: session.user.id,
    action: 'CREATE',
    resource: 'StaffAccount',
    resourceId: staff.id,
    after: { email: staff.email, role: staff.role },
    ipAddress,
    userAgent,
  })

  return NextResponse.json({ staff }, { status: 201 })
}
