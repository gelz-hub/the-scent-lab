// The single source of truth for role -> module permissions. Every admin
// API route enforces access through requirePermission() (see
// require-permission.ts), which reads this config — never re-implements
// its own role check. See src/lib/rbac/README.md.

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER'

export const ADMIN_ROLES: AdminRole[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'VIEWER']

export const MODULES = [
  'orders',
  'products',
  'catalog', // brands/categories/collections — part of product management
  'inventory',
  'customers',
  'payments',
  'shipments',
  'invoices',
  'notifications',
  'staff',
  'settings',
  'auditLog',
  'search',
  'analytics', // Part 9 — read-only reporting; granted alongside orders/inventory/payments per role, see ROLE_ACCESS below
] as const

export type Module = (typeof MODULES)[number]
export type Action = 'read' | 'write'

interface RoleAccess {
  modules: Module[]
  /** Every module this role can reach is view-only (VIEWER). */
  readOnly?: boolean
}

/**
 * The permission matrix from the Part 8 spec:
 *   Super Admin — full access
 *   Admin       — Orders, Products, Inventory, Customers, Payments
 *   Manager     — Orders, Inventory, Shipments
 *   Staff       — Orders and Shipments only
 *   Viewer      — read-only (every module, no writes)
 *
 * Invoices/notifications/search are granted alongside the modules they
 * naturally accompany (invoices with orders/payments; notifications/search
 * are informational, given to every staff-facing role) rather than listed
 * again per spec's exact wording — see src/lib/rbac/README.md for the
 * reasoning per role.
 */
export const ROLE_ACCESS: Record<AdminRole, RoleAccess> = {
  SUPER_ADMIN: { modules: [...MODULES] },
  ADMIN: {
    modules: ['orders', 'products', 'catalog', 'inventory', 'customers', 'payments', 'invoices', 'notifications', 'search', 'analytics'],
  },
  MANAGER: {
    modules: ['orders', 'inventory', 'shipments', 'invoices', 'notifications', 'search', 'analytics'],
  },
  STAFF: {
    modules: ['orders', 'shipments', 'notifications', 'search'],
  },
  VIEWER: {
    modules: [...MODULES],
    readOnly: true,
  },
}

export function isAdminRole(role: string): role is AdminRole {
  return (ADMIN_ROLES as string[]).includes(role)
}

export function hasPermission(role: string, module: Module, action: Action = 'write'): boolean {
  if (!isAdminRole(role)) return false
  const access = ROLE_ACCESS[role]
  if (!access.modules.includes(module)) return false
  if (action === 'write' && access.readOnly) return false
  return true
}
