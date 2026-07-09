# Address & Map System

Cambodia-only address collection: search, current-location detection, an
interactive map, and cascading province/district selects. Built for The Scent
Lab's checkout but deliberately decoupled from it — checkout components only
ever talk to the pieces documented here, never to a map/geocoding SDK
directly.

## Folder structure

```
src/data/cambodia/                  Administrative datasets (JSON, versioned — see below)
  provinces.json
  districts.json

src/lib/maps/
  config.ts                         All tunable values (debounce, cache TTL, map center/zoom, tile URL)
  types.ts                          ResolvedAddress / AddressSuggestion / LatLng shared shapes
  logger.ts                         Server-side geocoding failure logging (never shown to customers)
  constants/
    provinces.ts                    Reads the JSON datasets, exposes CAMBODIA_PROVINCES + districtsFor()
    normalization.ts                Province/district name variant → canonical name lookup tables
  providers/
    types.ts                        GeocodingProvider interface — implement this to add a new provider
    geoapify-provider.ts            Current implementation (Geoapify Geocoding + Autocomplete APIs)
    index.ts                        getGeocodingProvider() — the single switch point for provider choice
  services/
    geoapify.ts                     CLIENT-side fetch wrapper — calls OUR OWN /api/geocode/* routes
    search-cache.ts                 In-memory autocomplete result cache

src/hooks/maps/
  use-current-location.ts           Browser geolocation → reverse geocode, with permission-denied handling
  use-reverse-geocode.ts            Shared reverse-geocode call with loading/error state
  use-address-search.ts             Debounced, cached, min-length-gated autocomplete

src/components/maps/
  MapPicker.tsx                     Public entry point — lazy-loads Leaflet (ssr:false), never touches window on the server
  map-picker-inner.tsx              The actual react-leaflet implementation (private — only MapPicker imports it)
  MapMarker.tsx                     Draggable marker
  MapControls.tsx                   Floating "recenter" button overlay
  AddressSearch.tsx                 Autocomplete input + suggestion dropdown
  CurrentLocationButton.tsx         "Use Current Location" button
  MapLoading.tsx / MapError.tsx     Shared loading/error UI

src/components/checkout/
  shipping-address-form.tsx         Composes the components above; owns no geocoding logic itself
  address-preview-card.tsx          Formatted address summary + "Edit" action

src/app/api/geocode/
  reverse/route.ts                  Server route — calls the active provider, never exposes the API key
  search/route.ts                   Same, for autocomplete
```

## Data flow

1. User types in `AddressSearch`, drags the map pin, clicks the map, or hits
   "Use Current Location."
2. The relevant hook (`use-address-search`, `use-reverse-geocode`, or
   `use-current-location`) calls the client service
   (`lib/maps/services/geoapify.ts`), which fetches **our own** API route —
   never Geoapify directly. The Geoapify API key is a server-only env var and
   never reaches the browser.
3. The API route (`app/api/geocode/*`) calls `getGeocodingProvider()` and
   awaits the result.
4. The provider (`geoapify-provider.ts`) calls the real Geoapify API,
   normalizes the returned province/district names (see Normalization,
   below), and returns a `ResolvedAddress`/`AddressSuggestion[]`.
5. `shipping-address-form.tsx` applies the resolved values to the
   `react-hook-form` state via `setValue` — every field stays user-editable
   afterward.

Nothing in this chain blocks checkout: any failure at step 3 or 4 returns
`null`/`[]`, is logged server-side (`logGeoFailure`), and the UI shows a
friendly, non-technical message via `MapError` while manual entry keeps
working.

## Geoapify integration

Used for two things only:
- **Reverse geocoding** (coordinates → address) — `/api/geocode/reverse`
- **Autocomplete** (free text → address suggestions) — `/api/geocode/search`

The map's tiles come from OpenStreetMap directly (no API key, no request
through our backend) — Geoapify is not used for map rendering.

Free tier, no credit card required: [myprojects.geoapify.com](https://myprojects.geoapify.com).
Enable **Geocoding API** and **Places API** (autocomplete lives under Places).

## Administrative datasets

`src/data/cambodia/provinces.json` and `districts.json` are **data, not
code** — plain JSON, versioned:

```json
{
  "version": "1.0",
  "country": "Cambodia",
  "source": "...",
  "lastUpdated": "2026-07-08",
  "data": [...]
}
```

The current seed data is community-compiled (cross-checked against the
published `@svg-maps/cambodia` package for the province list; districts are
the standard post-2018 administrative structure). It is **not** sourced from
an official government dataset — good enough for checkout convenience
(District always falls back to free text if a province isn't in the list),
but should be replaced with an official NIS/MOI source before being treated
as authoritative.

Commune and Village are intentionally free text — no reliable open dataset
was available at implementation time. `communes.json`/`villages.json` are
reserved paths for when one is added; wiring them in would mean adding a
`communesFor(province, district)` helper next to `districtsFor()` in
`constants/provinces.ts`, and switching the Commune field in
`shipping-address-form.tsx` from an `<Input>` to a cascading `<Select>` —
the same pattern District already uses.

### Replacing a dataset

1. Get the new source into the same `{ version, country, source, lastUpdated,
   data }` shape.
2. Overwrite the JSON file(s) in `src/data/cambodia/`.
3. Bump `version` and `lastUpdated`.
4. Nothing else changes — `constants/provinces.ts` is the only file that
   knows the on-disk shape, and every consumer (`CAMBODIA_PROVINCES`,
   `districtsFor()`) is unaffected as long as the shape matches.

## Replacing the map/geocoding provider

Geocoding and map rendering are separate concerns here, and are swapped
differently:

**Geocoding provider** (reverse geocode + autocomplete): implement
`GeocodingProvider` (`lib/maps/providers/types.ts`) in a new file — same
shape as `geoapify-provider.ts` — then return it from
`getGeocodingProvider()` in `lib/maps/providers/index.ts`. No API route, hook,
or checkout component changes.

**Map tiles**: `map-picker-inner.tsx` reads `mapConfig.tileUrl` /
`tileAttribution` from `lib/maps/config.ts` (env-overridable). Any
Leaflet-compatible XYZ tile source (Mapbox, HERE, etc. via their raster tile
endpoints) is a config change, not a code change. Switching to a genuinely
different map *library* (e.g. Google Maps JS SDK instead of Leaflet) would
mean rewriting `map-picker-inner.tsx`, `MapMarker.tsx`, and `MapControls.tsx`
against that SDK — `MapPicker.tsx`'s public interface (`latitude`,
`longitude`, `onChange`, `onRecenter`) is designed to stay the same either
way, so `shipping-address-form.tsx` wouldn't need to change.

## Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `GEOAPIFY_API_KEY` | Yes (server-only) | — | Never exposed to the client |
| `NEXT_PUBLIC_MAP_DEFAULT_LAT` / `_LNG` | No | Phnom Penh (11.5564, 104.9282) | Map center before any address is set |
| `NEXT_PUBLIC_MAP_DEFAULT_ZOOM` | No | `12` | Zoom before a pin is placed |
| `NEXT_PUBLIC_MAP_PIN_ZOOM` | No | `16` | Zoom once a pin is placed |
| `NEXT_PUBLIC_MAP_TILE_URL` | No | OpenStreetMap XYZ URL | Any Leaflet-compatible tile source |
| `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION` | No | OSM attribution HTML | Must match the tile source's license terms |
| `NEXT_PUBLIC_ADDRESS_SEARCH_MIN_CHARS` | No | `3` | Autocomplete won't fire below this |
| `NEXT_PUBLIC_ADDRESS_SEARCH_DEBOUNCE_MS` | No | `350` | |
| `NEXT_PUBLIC_ADDRESS_SEARCH_CACHE_TTL_MS` | No | `300000` (5 min) | In-memory only, per browser tab |

## Monitoring

Every geocoding/reverse-geocoding failure (missing API key, network error,
non-2xx response, empty result) is logged server-side via
`logGeoFailure()` in `lib/maps/logger.ts` — check server logs for
`[maps:geoapify] ...` entries. Customers never see these; they only see the
friendly `MapError` copy.

## Future maintenance notes

- Replace the seed province/district data with an official source when one
  becomes available (see "Replacing a dataset" above).
- Add `communes.json` the same way if/when a reliable commune-level dataset
  is found.
- If Geoapify's free tier (3,000 credits/day) becomes a bottleneck, either
  add a second provider behind the same interface as a fallback, or raise
  the autocomplete cache TTL / min-chars via env vars before writing new
  code.
- `logGeoFailure` currently writes to `console.error`. If a structured
  logging/observability service gets added to the project, point it there
  instead — call sites don't need to change.
