// Shared CSV helper for every admin export route — one escaping/formatting
// implementation instead of each route reimplementing it (see
// src/app/api/admin/payments/export/route.ts for the original one-off this
// generalizes). See src/lib/rbac/README.md, "Export".

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  return `"${str.replace(/"/g, '""')}"`
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
}

export function csvResponseHeaders(filenamePrefix: string) {
  return {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv"`,
  }
}
