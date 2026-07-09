'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Loader2, ScrollText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ACTIONS = [
  'ALL', 'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'ARCHIVE',
  'STATUS_CHANGE', 'INVENTORY_ADJUSTMENT', 'PAYMENT_VERIFICATION', 'SHIPMENT_CHANGE', 'ROLE_CHANGE',
] as const

interface AuditEntry {
  id: string
  action: string
  resource: string
  resourceId: string | null
  before: unknown
  after: unknown
  ipAddress: string | null
  createdAt: string
  user: { name: string | null; email: string } | null
}

export function AuditLogClient() {
  const [entries, setEntries] = React.useState<AuditEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [action, setAction] = React.useState<string>('ALL')
  const [expanded, setExpanded] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (action !== 'ALL') params.set('action', action)
      const res = await fetch(`/api/admin/audit-log?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not load audit log')
        return
      }
      setEntries(data.entries ?? [])
    } catch {
      toast.error('Could not load audit log')
    } finally {
      setLoading(false)
    }
  }, [action])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Append-only record of every sensitive admin action — never edited or deleted.</p>
      </div>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg font-medium tracking-tight">All activity</CardTitle>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-52" aria-label="Filter by action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="pr-6">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" strokeWidth={1.5} />
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    <ScrollText className="mx-auto h-8 w-8" strokeWidth={1.25} />
                    <div className="mt-2 text-sm">No activity recorded yet.</div>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e) => (
                  <React.Fragment key={e.id}>
                    <TableRow className="cursor-pointer" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                      <TableCell className="pl-6 font-medium">{e.action.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-muted-foreground">{e.resource}{e.resourceId ? ` · ${e.resourceId.slice(0, 8)}…` : ''}</TableCell>
                      <TableCell>{e.user?.name || e.user?.email || 'System'}</TableCell>
                      <TableCell className="text-muted-foreground">{e.ipAddress || '—'}</TableCell>
                      <TableCell className="pr-6 text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                    {expanded === e.id && (before(e) || after(e)) && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-surface px-6 py-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            {before(e) && (
                              <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Before</p>
                                <pre className="overflow-auto rounded-md bg-background p-3 text-xs">{JSON.stringify(e.before, null, 2)}</pre>
                              </div>
                            )}
                            {after(e) && (
                              <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">After</p>
                                <pre className="overflow-auto rounded-md bg-background p-3 text-xs">{JSON.stringify(e.after, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function before(e: AuditEntry) {
  return e.before != null
}
function after(e: AuditEntry) {
  return e.after != null
}
