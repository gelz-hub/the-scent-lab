'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmail } from '@/lib/firebase/auth-client'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/site/breadcrumb'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [showPwd, setShowPwd] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !confirm) {
      toast.error('Please complete all fields')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not create account')
        return
      }
      await signInWithEmail(email, password)
      toast.success('Account created', {
        description: 'Welcome to The Scent Lab.',
      })
      router.push('/account')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Create account' }]} />

      <div className="mb-8 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          Join The Scent Lab
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">
          Create account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save your favourites, check out faster, and track every order.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Full name
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 focus-within:border-foreground/60">
              <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Laurent"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Email address
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 focus-within:border-foreground/60">
              <Mail className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Password
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
                placeholder="At least 8 characters"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPwd ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Confirm password
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 focus-within:border-foreground/60">
              <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                id="confirm"
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="underline-offset-2 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
            {!loading && <ArrowRight className="h-4 w-4" strokeWidth={1.5} />}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
