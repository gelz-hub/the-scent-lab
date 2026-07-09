import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/rbac/require-permission'
import { REPORTS } from '@/lib/analytics/report-types'
import { listScheduledReports, createScheduledReport } from '@/lib/analytics/scheduled-report-service'
import { recordAudit, requestMetadata } from '@/lib/audit/audit-service'

export async function GET() {
  const { allowed } = await requirePermission('analytics', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  return NextResponse.json({ scheduledReports: await listScheduledReports() })
}

const createSchema = z.object({
  report: z.enum(REPORTS),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  recipients: z.array(z.string().email()).min(1),
})

/** Creates the CONFIGURATION only — no schedule actually runs yet, see scheduled-report-service.ts. */
export async function POST(req: Request) {
  const { session, allowed } = await requirePermission('analytics', 'write')
  if (!allowed || !session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 })

  const scheduledReport = await createScheduledReport({ ...parsed.data, createdById: session.user.id })

  const { ipAddress, userAgent } = requestMetadata(req)
  await recordAudit({
    userId: session.user.id,
    action: 'CREATE',
    resource: 'ScheduledReport',
    resourceId: scheduledReport.id,
    after: parsed.data,
    ipAddress,
    userAgent,
  })

  return NextResponse.json({ scheduledReport }, { status: 201 })
}
