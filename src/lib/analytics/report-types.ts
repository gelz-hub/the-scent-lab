export const REPORTS = ['sales', 'orders', 'payments', 'products', 'customers', 'shipments', 'inventory'] as const
export type Report = (typeof REPORTS)[number]
