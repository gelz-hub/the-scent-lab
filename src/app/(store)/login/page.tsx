'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
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
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    setLoading(false)

    if (!result || result.error) {
      toast.error('Invalid email or password')
      return
    }

    toast.success('Signed in', {
      description: 'Welcome back to The Scent Lab.',
    })
    const callbackUrl = searchParams.get('callbackUrl')
    router.push(callbackUrl || '/account')
    router.refresh()
  }

  const handleGoogle = () => {
    toast.info('Google sign-in is not available in this demo', {
      description: 'Use email + password to continue.',
    })
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
              <button
                type="button"
                onClick={() =>
                  toast.info('Password reset link sent', {
                    description: 'Check your inbox for further steps.',
                  })
                }
                className="text-xs text-brand transition-colors hover:text-foreground"
              >
                Forgot password?
              </button>
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

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          OR
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-medium transition-colors hover:border-foreground/40"
        >
          <GoogleIcon />
          Continue with Google
        </button>
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

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}
