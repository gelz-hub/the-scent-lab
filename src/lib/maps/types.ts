export interface ResolvedAddress {
  province: string
  district: string
  commune: string
  village: string
  streetAddress: string
  postalCode: string
  latitude: number
  longitude: number
  formatted: string
}

export interface AddressSuggestion {
  formatted: string
  province: string
  district: string
  streetAddress: string
  latitude: number
  longitude: number
}

export interface LatLng {
  lat: number
  lng: number
}
