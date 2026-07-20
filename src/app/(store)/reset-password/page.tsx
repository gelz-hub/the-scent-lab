'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { confirmPasswordReset } from '@/lib/firebase/auth-client'

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordForm />
    </React.Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('oobCode') || ''

  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPwd, setShowPwd] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast.error('This reset link is invalid or has expired.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await confirmPasswordReset(token, password)
    } catch {
      toast.error('This reset link is invalid or has expired.')
      return
    } finally {
      setLoading(false)
    }
    toast.success('Password reset', { description: 'You can now sign in with your new password.' })
    router.push('/login')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Sign in', href: '/login' }, { label: 'Reset password' }]} />

      <div className="mb-8 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          Account recovery
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        {!token ? (
          <p className="text-sm text-muted-foreground">
            This reset link is invalid or has expired.{' '}
            <Link href="/forgot-password" className="font-medium text-foreground underline-offset-4 hover:underline">
              Request a new one
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                New password
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 focus-within:border-foreground/60">
                <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Confirm new password
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 focus-within:border-foreground/60">
                <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  id="confirmPassword"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground disabled:opacity-60"
            >
              {loading ? 'Resetting…' : 'Reset password'}
              {!loading && <ArrowRight className="h-4 w-4" strokeWidth={1.5} />}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
