// The one function every admin API route should call instead of writing
// its own `session.user.role !== 'ADMIN'`-style check. Enforces on the
// server — frontend visibility (hiding a nav link) is never sufficient on
// its own, per spec. See src/lib/rbac/README.md.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, type Module, type Action } from './permissions'
import type { Session } from 'next-auth'

export type PermissionResult = { session: Session; allowed: true } | { session: Session | null; allowed: false }

export async function requirePermission(module: Module, action: Action = 'write'): Promise<PermissionResult> {
  const session = await getServerSession(authOptions)
  if (!session) return { session: null, allowed: false }
  if (!hasPermission(session.user.role, module, action)) return { session, allowed: false }
  return { session, allowed: true }
}
