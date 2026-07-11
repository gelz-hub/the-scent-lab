'use client'

import * as React from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Pencil, X, Check, Upload } from 'lucide-react'
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
  tagline?: string | null
  country?: string | null
  foundedYear?: number | null
  imageUrl?: string | null
  logoUrl?: string | null
}

interface FieldDef {
  key: 'tagline' | 'country' | 'foundedYear' | 'imageUrl' | 'logoUrl'
  label: string
  placeholder?: string
  type?: 'text' | 'number' | 'image'
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Upload failed')
        return
      }
      onChange(data.url)
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
        {value && <Image src={value} alt="" fill sizes="40px" className="object-cover" />}
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${label} URL — or upload`}
        className="flex-1"
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Button type="button" variant="outline" size="icon" disabled={uploading} onClick={() => inputRef.current?.click()} aria-label={`Upload ${label}`}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" strokeWidth={1.5} />}
      </Button>
    </div>
  )
}

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function emptyDraft(): Record<string, string> {
  return { name: '', description: '', tagline: '', country: '', foundedYear: '', imageUrl: '', logoUrl: '' }
}

function draftFromEntry(e: Entry): Record<string, string> {
  return {
    name: e.name,
    description: e.description ?? '',
    tagline: e.tagline ?? '',
    country: e.country ?? '',
    foundedYear: e.foundedYear ? String(e.foundedYear) : '',
    imageUrl: e.imageUrl ?? '',
    logoUrl: e.logoUrl ?? '',
  }
}

function toPayload(draft: Record<string, string>, extraFields: FieldDef[]) {
  const payload: Record<string, unknown> = {
    name: draft.name.trim(),
    slug: slugify(draft.name),
    description: draft.description.trim() || undefined,
  }
  for (const f of extraFields) {
    const raw = draft[f.key]?.trim()
    if (!raw) continue
    payload[f.key] = f.type === 'number' ? Number(raw) : raw
  }
  return payload
}

function EntityManager({ kind, endpoint, extraFields }: { kind: string; endpoint: string; extraFields: FieldDef[] }) {
  const [entries, setEntries] = React.useState<Entry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [creating, setCreating] = React.useState(false)
  const [draft, setDraft] = React.useState<Record<string, string>>(emptyDraft())
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editDraft, setEditDraft] = React.useState<Record<string, string>>(emptyDraft())
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
    if (!draft.name.trim()) {
      toast.error('Name is required.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(draft, extraFields)),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || `Could not create ${kind.toLowerCase()}.`)
        return
      }
      toast.success(`${kind} created`)
      setDraft(emptyDraft())
      setCreating(false)
      load()
    } catch {
      toast.error(`Could not create ${kind.toLowerCase()}.`)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id: string) {
    if (!editDraft.name.trim()) {
      toast.error('Name is required.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(editDraft, extraFields)),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || `Could not update ${kind.toLowerCase()}.`)
        return
      }
      toast.success(`${kind} updated`)
      setEditingId(null)
      load()
    } catch {
      toast.error(`Could not update ${kind.toLowerCase()}.`)
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

  const colSpan = 3 + extraFields.length

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-display text-lg font-medium tracking-tight">{kind}s</CardTitle>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Add {kind.toLowerCase()}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {creating && (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder={`${kind} name`}
                autoFocus
              />
              <Input
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Description"
              />
              {extraFields.map((f) =>
                f.type === 'image' ? (
                  <ImageField
                    key={f.key}
                    label={f.label}
                    value={draft[f.key]}
                    onChange={(url) => setDraft((d) => ({ ...d, [f.key]: url }))}
                  />
                ) : (
                  <Input
                    key={f.key}
                    type={f.type ?? 'text'}
                    value={draft[f.key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={f.placeholder ?? f.label}
                  />
                )
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreating(false)
                  setDraft(emptyDraft())
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              {extraFields.map((f) => (
                <TableHead key={f.key}>{f.label}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" strokeWidth={1.5} />
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
                  No {kind.toLowerCase()}s yet.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((e) =>
                editingId === e.id ? (
                  <TableRow key={e.id}>
                    <TableCell colSpan={colSpan}>
                      <div className="space-y-3 py-2">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            value={editDraft.name}
                            onChange={(ev) => setEditDraft((d) => ({ ...d, name: ev.target.value }))}
                            placeholder={`${kind} name`}
                          />
                          <Input
                            value={editDraft.description}
                            onChange={(ev) => setEditDraft((d) => ({ ...d, description: ev.target.value }))}
                            placeholder="Description"
                          />
                          {extraFields.map((f) =>
                            f.type === 'image' ? (
                              <ImageField
                                key={f.key}
                                label={f.label}
                                value={editDraft[f.key]}
                                onChange={(url) => setEditDraft((d) => ({ ...d, [f.key]: url }))}
                              />
                            ) : (
                              <Input
                                key={f.key}
                                type={f.type ?? 'text'}
                                value={editDraft[f.key]}
                                onChange={(ev) => setEditDraft((d) => ({ ...d, [f.key]: ev.target.value }))}
                                placeholder={f.placeholder ?? f.label}
                              />
                            )
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                            <X className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => handleUpdate(e.id)} disabled={saving}>
                            {saving ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.slug}</TableCell>
                    {extraFields.map((f) => {
                      const val = (e as unknown as Record<string, string | number | null | undefined>)[f.key]
                      return (
                        <TableCell key={f.key} className="text-muted-foreground">
                          {f.type === 'image' ? (
                            val ? (
                              <div className="relative h-8 w-8 overflow-hidden rounded-md border border-border bg-surface">
                                <Image src={String(val)} alt="" fill sizes="32px" className="object-cover" />
                              </div>
                            ) : (
                              '—'
                            )
                          ) : (
                            (val ?? '—')
                          )}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${e.name}`}
                        onClick={() => {
                          setEditingId(e.id)
                          setEditDraft(draftFromEntry(e))
                        }}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${e.name}`} onClick={() => handleDelete(e.id)}>
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

const BRAND_FIELDS: FieldDef[] = [
  { key: 'tagline', label: 'Tagline', placeholder: 'e.g. Parisian elegance, bottled.' },
  { key: 'country', label: 'Country', placeholder: 'e.g. France' },
  { key: 'foundedYear', label: 'Founded', placeholder: 'e.g. 1946', type: 'number' },
  { key: 'logoUrl', label: 'Logo', type: 'image' },
]

const CATEGORY_FIELDS: FieldDef[] = [{ key: 'imageUrl', label: 'Image', type: 'image' }]

const COLLECTION_FIELDS: FieldDef[] = [
  { key: 'tagline', label: 'Tagline', placeholder: 'e.g. The world\'s most coveted flacons' },
  { key: 'imageUrl', label: 'Image', type: 'image' },
]

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
          <EntityManager kind="Brand" endpoint="/api/admin/brands" extraFields={BRAND_FIELDS} />
        </TabsContent>
        <TabsContent value="categories">
          <EntityManager kind="Category" endpoint="/api/admin/categories" extraFields={CATEGORY_FIELDS} />
        </TabsContent>
        <TabsContent value="collections">
          <EntityManager kind="Collection" endpoint="/api/admin/collections" extraFields={COLLECTION_FIELDS} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
