// AuditService — the only thing that writes to AuditLog. Append-only:
// nothing here ever updates or deletes a row. Independent of every other
// Part 8 service; callers pass in whatever `before`/`after` shape makes
// sense for that action. See src/lib/rbac/README.md, "Audit Log".

import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { logger } from '@/lib/logging/logger'

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ARCHIVE'
  | 'STATUS_CHANGE'
  | 'INVENTORY_ADJUSTMENT'
  | 'PAYMENT_VERIFICATION'
  | 'SHIPMENT_CHANGE'
  | 'ROLE_CHANGE'

export interface RecordAuditInput {
  userId?: string | null
  action: AuditAction
  resource: string
  resourceId?: string
  before?: unknown
  after?: unknown
  ipAddress?: string | null
  userAgent?: string | null
}

/** Never throws into the caller's hot path — an audit-log write failure must never block the actual operation it's recording. */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        before: (input.before ?? undefined) as Prisma.InputJsonValue | undefined,
        after: (input.after ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    })
  } catch (error) {
    logger.error('system', 'audit_write_failed', { action: input.action, resource: input.resource, error })
  }
}

export interface AuditLogFilters {
  userId?: string
  resource?: string
  action?: AuditAction
}

export async function listAuditLog(filters: AuditLogFilters = {}, options: { take?: number; skip?: number } = {}) {
  return db.auditLog.findMany({
    where: {
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.resource && { resource: filters.resource }),
      ...(filters.action && { action: filters.action }),
    },
    orderBy: { createdAt: 'desc' },
    take: options.take ?? 100,
    skip: options.skip ?? 0,
    include: { user: { select: { name: true, email: true } } },
  })
}

/** Pulls IP/user-agent out of a Next.js Request the same way everywhere — used by every route that calls recordAudit. IP parsing shares its logic with src/lib/security/rate-limit.ts's clientIp(). */
export function requestMetadata(req: Request): { ipAddress: string | null; userAgent: string | null } {
  const forwardedFor = req.headers.get('x-forwarded-for')
  return {
    ipAddress: forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip'),
    userAgent: req.headers.get('user-agent'),
  }
}
