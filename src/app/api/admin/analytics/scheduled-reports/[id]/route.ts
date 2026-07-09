import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/rbac/require-permission'
import { toggleScheduledReport, deleteScheduledReport } from '@/lib/analytics/scheduled-report-service'

const updateSchema = z.object({ enabled: z.boolean() })

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission('analytics', 'write')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const scheduledReport = await toggleScheduledReport(id, parsed.data.enabled)
  return NextResponse.json({ scheduledReport })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await requirePermission('analytics', 'write')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  await deleteScheduledReport(id)
  return NextResponse.json({ success: true })
}
