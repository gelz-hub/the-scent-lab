import { z } from 'zod'

// Shared password-strength rule — used by both /api/register and
// /api/account/change-password so the two never drift. Length-only (8-100
// chars) was the previous rule; this adds a minimal complexity requirement
// (at least one letter and one number) without being so strict it locks
// real users out of a passphrase-style password. See
// src/lib/security/README.md, "Password validation".
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(100)
  .refine((v) => /[a-zA-Z]/.test(v), 'Password must include at least one letter.')
  .refine((v) => /[0-9]/.test(v), 'Password must include at least one number.')
