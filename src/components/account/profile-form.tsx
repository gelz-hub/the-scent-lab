'use client'

import * as React from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Loader2, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Profile {
  name: string | null
  phone: string | null
  dateOfBirth: string | null
  avatarUrl: string | null
  preferredCurrency: string | null
}

export function ProfileForm() {
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [dateOfBirth, setDateOfBirth] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetch('/api/account/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile)
          setName(data.profile.name ?? '')
          setPhone(data.profile.phone ?? '')
          setDateOfBirth(data.profile.dateOfBirth ? data.profile.dateOfBirth.slice(0, 10) : '')
        }
      })
      .catch(() => toast.error('Could not load profile'))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, dateOfBirth }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not save profile.')
        return
      }
      setProfile(data.profile)
      toast.success('Profile updated')
    } catch {
      toast.error('Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/account/avatar', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not upload photo.')
        return
      }
      setProfile(data.profile)
      toast.success('Profile picture updated')
    } catch {
      toast.error('Could not upload photo.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-xl border border-border p-6">
      <h2 className="font-display text-lg font-medium">Profile</h2>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface">
          {profile?.avatarUrl ? (
            <Image src={profile.avatarUrl} alt="Profile picture" fill sizes="64px" className="object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <UserIcon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Change photo
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Full name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>Phone number</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>Date of birth (optional)</Label>
          <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="mt-1.5" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="mt-5">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save profile
      </Button>
    </div>
  )
}
