import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit/audit-service'
import { rateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logging/logger'

const isProd = process.env.NODE_ENV === 'production'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    // 7 days, refreshed on activity — was previously NextAuth's unstated
    // 30-day default. Shorter than a typical customer "remember me" window
    // on purpose: this app has no separate short-lived admin session, so
    // the same expiry protects both an abandoned customer browser and an
    // abandoned staff/admin one. See src/lib/security/README.md, "Session
    // expiration".
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60,
  },
  // Explicit rather than relying on NextAuth's defaults, so the actual
  // production cookie policy is visible in code, not implied. `secure` is
  // only forced in production — a plain-HTTP local dev server can't set a
  // Secure cookie at all.
  cookies: {
    sessionToken: {
      name: isProd ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
    },
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        // 10 attempts / 5 minutes per IP+email — blunt but effective
        // brute-force throttle. Keyed on both so one attacker guessing many
        // emails from one IP is limited by IP, and a distributed attempt
        // against one account is limited by email. See
        // src/lib/security/README.md, "Rate limiting".
        const forwardedFor = req.headers?.['x-forwarded-for']
        const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0].trim() ?? 'unknown'
        const key = `login:${ip}:${credentials.email.toLowerCase()}`
        const { allowed } = rateLimit(key, 10, 5 * 60 * 1000)
        if (!allowed) {
          logger.warn('auth', 'login_rate_limited', { email: credentials.email.toLowerCase(), ip })
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) {
          logger.warn('auth', 'login_failed', { email: credentials.email.toLowerCase(), ip })
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  events: {
    // NextAuth v4's sign-in event doesn't carry the request (no IP/user-agent
    // here) — only actions triggered through a route handler (which does have
    // the Request) capture those, via requestMetadata() in audit-service.ts.
    async signIn({ user }) {
      await recordAudit({ userId: user.id, action: 'LOGIN', resource: 'Session' })
    },
    async signOut({ token }) {
      await recordAudit({ userId: token.id, action: 'LOGOUT', resource: 'Session' })
    },
  },
}
