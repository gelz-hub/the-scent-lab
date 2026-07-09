import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac/require-permission'
import { listAuditLog, type AuditAction } from '@/lib/audit/audit-service'

export async function GET(req: Request) {
  const { allowed } = await requirePermission('auditLog', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const resource = searchParams.get('resource') || undefined
  const action = (searchParams.get('action') as AuditAction | null) || undefined

  const entries = await listAuditLog({ resource, action })
  return NextResponse.json({ entries })
}
