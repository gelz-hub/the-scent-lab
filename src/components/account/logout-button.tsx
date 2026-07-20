'use client'

import { signOut } from '@/components/providers/session-provider'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  async function handleSignOut() {
    await signOut({ redirect: false })
    toast.success('Signed out', { description: 'You have been signed out of your account.' })
    window.location.href = '/'
  }

  return (
    <Button variant="outline" onClick={handleSignOut} className="mt-3">
      <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
      Log out
    </Button>
  )
}
