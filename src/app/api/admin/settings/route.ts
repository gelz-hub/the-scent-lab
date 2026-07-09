import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/rbac/require-permission'
import { getAllSettings, updateSetting, SETTINGS_KEYS } from '@/lib/settings/settings-service'
import { recordAudit, requestMetadata } from '@/lib/audit/audit-service'

export async function GET() {
  const { allowed } = await requirePermission('settings', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  return NextResponse.json({ settings: await getAllSettings() })
}

const updateSchema = z.object({
  key: z.enum(SETTINGS_KEYS),
  value: z.unknown(),
})

export async function PATCH(req: Request) {
  const { session, allowed } = await requirePermission('settings', 'write')
  if (!allowed || !session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid setting.' }, { status: 400 })

  const before = await getAllSettings().then((s) => s[parsed.data.key])
  const setting = await updateSetting(parsed.data.key, parsed.data.value, session.user.id)

  const { ipAddress, userAgent } = requestMetadata(req)
  await recordAudit({
    userId: session.user.id,
    action: 'UPDATE',
    resource: 'SystemSetting',
    resourceId: parsed.data.key,
    before: { value: before },
    after: { value: parsed.data.value },
    ipAddress,
    userAgent,
  })

  return NextResponse.json({ setting })
}
