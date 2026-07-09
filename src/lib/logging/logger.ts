// Centralized structured logger — the general-purpose counterpart to the
// domain-specific loggers already in place (src/lib/payment/monitoring.ts,
// src/lib/inventory/monitoring.ts). Use those two for payment/inventory
// events specifically; use this for everything else (auth, admin actions,
// shipments, general API errors) so there's one place, not a dozen ad-hoc
// console.log calls, to swap for a real backend (Sentry, Datadog, CloudWatch)
// later. See src/lib/security/README.md, "Logging".
//
// Hard rule, never relaxed here or by any caller: never log passwords,
// tokens, session/JWT contents, card numbers, or other payment secrets.
// Log identifiers (userId, orderId, email) and error messages, not raw
// request bodies or credentials.

export type LogScope = 'auth' | 'admin' | 'shipment' | 'api' | 'system'
export type LogLevel = 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  resource?: string
  resourceId?: string
  route?: string
  error?: unknown
  [key: string]: unknown
}

function serialize(scope: LogScope, level: LogLevel, event: string, context: LogContext) {
  const { error, ...rest } = context
  return {
    scope,
    level,
    event,
    ...rest,
    ...(error !== undefined && { error: error instanceof Error ? error.message : String(error) }),
    timestamp: new Date().toISOString(),
  }
}

function write(scope: LogScope, level: LogLevel, event: string, context: LogContext) {
  const entry = serialize(scope, level, event, context)
  const line = `[${scope}] ${JSON.stringify(entry)}`
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)
}

export const logger = {
  info: (scope: LogScope, event: string, context: LogContext = {}) => write(scope, 'info', event, context),
  warn: (scope: LogScope, event: string, context: LogContext = {}) => write(scope, 'warn', event, context),
  error: (scope: LogScope, event: string, context: LogContext = {}) => write(scope, 'error', event, context),
}
