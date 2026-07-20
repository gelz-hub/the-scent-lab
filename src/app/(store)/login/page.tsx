'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmail } from '@/lib/firebase/auth-client'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/site/breadcrumb'

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPwd, setShowPwd] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in both fields')
      return
    }
    setLoading(true)
    try {
      await signInWithEmail(email, password)
    } catch {
      toast.error('Invalid email or password')
      return
    } finally {
      setLoading(false)
    }

    toast.success('Signed in', {
      description: 'Welcome back to The Scent Lab.',
    })
    const callbackUrl = searchParams.get('callbackUrl')
    router.push(callbackUrl || '/account')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Sign in' }]} />

      <div className="mb-8 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          Welcome back
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Access your orders, wishlist and saved addresses.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-muted-foreground"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-brand transition-colors hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 focus-within:border-foreground/60">
              <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
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
                {showPwd ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
            {!loading && <ArrowRight className="h-4 w-4" strokeWidth={1.5} />}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
