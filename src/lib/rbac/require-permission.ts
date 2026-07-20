// The one function every admin API route should call instead of writing
// its own `session.user.role !== 'ADMIN'`-style check. Enforces on the
// server — frontend visibility (hiding a nav link) is never sufficient on
// its own, per spec. See src/lib/rbac/README.md.

import { getAuthSession } from '@/lib/auth/session'
import { hasPermission, type Module, type Action } from './permissions'
import type { AuthSession } from '@/lib/auth/session'

export type PermissionResult = { session: AuthSession; allowed: true } | { session: AuthSession | null; allowed: false }

export async function requirePermission(module: Module, action: Action = 'write'): Promise<PermissionResult> {
  const session = await getAuthSession()
  if (!session) return { session: null, allowed: false }
  if (!hasPermission(session.user.role, module, action)) return { session, allowed: false }
  return { session, allowed: true }
}
