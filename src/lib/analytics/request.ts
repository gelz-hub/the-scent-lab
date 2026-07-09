import { resolveDateRange, RANGE_PRESETS, type RangePreset } from './date-ranges'

/** Parses `?range=7d&from=&to=` the same way in every analytics route. */
export function parseRangeFromRequest(req: Request) {
  const { searchParams } = new URL(req.url)
  const rangeParam = searchParams.get('range') ?? '30d'
  const preset: RangePreset = (RANGE_PRESETS as readonly string[]).includes(rangeParam) ? (rangeParam as RangePreset) : '30d'
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  return resolveDateRange(preset, from, to)
}
