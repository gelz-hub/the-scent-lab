'use client'

import dynamic from 'next/dynamic'
import { MapLoading } from './MapLoading'

// Leaflet touches `window` at import time, so the real implementation is only
// ever loaded on the client, and only once this component actually mounts —
// i.e. not until the Shipping Address step is opened.
const MapPickerInner = dynamic(() => import('./map-picker-inner'), {
  ssr: false,
  loading: () => <MapLoading />,
})

interface MapPickerProps {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number, lng: number) => void
  onRecenter: () => void
  locating?: boolean
  className?: string
}

export function MapPicker(props: MapPickerProps) {
  return <MapPickerInner {...props} />
}
