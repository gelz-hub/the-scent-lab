'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Entry {
  id: string
  name: string
  slug: string
  description?: string | null
  visibility: string
}

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function EntityManager({ kind, endpoint }: { kind: string; endpoint: string }) {
  const [entries, setEntries] = React.useState<Entry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [name, setName] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(endpoint)
      const data = await res.json()
      const key = Object.keys(data)[0]
      setEntries(data[key] ?? [])
    } catch {
      toast.error(`Could not load ${kind.toLowerCase()}s`)
    } finally {
      setLoading(false)
    }
  }, [endpoint, kind])

  React.useEffect(() => {
    load()
  }, [load])

  async function handleCreate() {
    if (!name.trim()) {
      toast.error('Name is required.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slugify(name) }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || `Could not create ${kind.toLowerCase()}.`)
        return
      }
      toast.success(`${kind} created`)
      setName('')
      load()
    } catch {
      toast.error(`Could not create ${kind.toLowerCase()}.`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || `Could not delete ${kind.toLowerCase()}.`)
        return
      }
      setEntries((prev) => prev.filter((e) => e.id !== id))
      toast.success(`${kind} deleted`)
    } catch {
      toast.error(`Could not delete ${kind.toLowerCase()}.`)
    }
  }

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle className="font-display text-lg font-medium tracking-tight">{kind}s</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`New ${kind.toLowerCase()} name`}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />}
            Add
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" strokeWidth={1.5} />
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  No {kind.toLowerCase()}s yet.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="text-muted-foreground">{e.slug}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" aria-label={`Delete ${e.name}`} onClick={() => handleDelete(e.id)}>
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function CatalogClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Catalog settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage brands, categories, and collections used across the catalog.</p>
      </div>

      <Tabs defaultValue="brands">
        <TabsList>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>
        <TabsContent value="brands">
          <EntityManager kind="Brand" endpoint="/api/admin/brands" />
        </TabsContent>
        <TabsContent value="categories">
          <EntityManager kind="Category" endpoint="/api/admin/categories" />
        </TabsContent>
        <TabsContent value="collections">
          <EntityManager kind="Collection" endpoint="/api/admin/collections" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
