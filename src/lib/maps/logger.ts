// Server-only logging for geocoding/reverse-geocoding failures. Customers only
// ever see the friendly messages already returned by the API routes/hooks —
// this exists so production issues (bad API key, provider outage, rate
// limits) are diagnosable from server logs instead of silently swallowed.

interface GeoLogContext {
  provider: string
  operation: 'reverseGeocode' | 'searchAddress'
  [key: string]: unknown
}

export function logGeoFailure(message: string, context: GeoLogContext, error?: unknown) {
  console.error(`[maps:${context.provider}] ${context.operation} failed — ${message}`, {
    ...context,
    error: error instanceof Error ? error.message : error,
    timestamp: new Date().toISOString(),
  })
}
