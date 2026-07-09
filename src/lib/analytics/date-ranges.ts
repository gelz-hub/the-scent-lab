// Shared date-range resolution for every analytics query — one
// implementation so "Last 7 Days" means the same thing in every report.
// See src/lib/analytics/README.md, "Filters".

export const RANGE_PRESETS = ['today', 'yesterday', '7d', '30d', '90d', 'custom'] as const
export type RangePreset = (typeof RANGE_PRESETS)[number]

export interface DateRange {
  start: Date
  end: Date
  /** Immediately preceding period of equal length — for "vs previous period" comparisons. */
  previousStart: Date
  previousEnd: Date
}

function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(23, 59, 59, 999)
  return copy
}

/**
 * Resolves a preset (or explicit `from`/`to` for 'custom') into a concrete
 * `{start, end}` window plus the equal-length preceding window, so every
 * report can show a period-over-period delta without recomputing it
 * per-metric.
 */
export function resolveDateRange(preset: RangePreset, from?: string | null, to?: string | null): DateRange {
  const now = new Date()

  if (preset === 'custom' && from && to) {
    const start = startOfDay(new Date(from))
    const end = endOfDay(new Date(to))
    const lengthMs = end.getTime() - start.getTime()
    return {
      start,
      end,
      previousStart: new Date(start.getTime() - lengthMs - 1),
      previousEnd: new Date(start.getTime() - 1),
    }
  }

  if (preset === 'today') {
    const start = startOfDay(now)
    const end = endOfDay(now)
    const yesterday = new Date(start)
    yesterday.setDate(yesterday.getDate() - 1)
    return { start, end, previousStart: startOfDay(yesterday), previousEnd: endOfDay(yesterday) }
  }

  if (preset === 'yesterday') {
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    const start = startOfDay(y)
    const end = endOfDay(y)
    const dayBefore = new Date(start)
    dayBefore.setDate(dayBefore.getDate() - 1)
    return { start, end, previousStart: startOfDay(dayBefore), previousEnd: endOfDay(dayBefore) }
  }

  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : preset === '90d' ? 90 : 30
  const end = endOfDay(now)
  const start = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000))
  const previousEnd = new Date(start.getTime() - 1)
  const previousStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000)
  return { start, end, previousStart, previousEnd }
}

/** Every calendar day between start and end, inclusive — the x-axis for "per day" charts. */
export function daysBetween(start: Date, end: Date): Date[] {
  const days: Date[] = []
  const cursor = startOfDay(start)
  const last = startOfDay(end)
  while (cursor <= last) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}
