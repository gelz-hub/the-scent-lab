'use client'

import { Marker } from 'react-leaflet'
import L from 'leaflet'

// Leaflet's default marker icons reference bundler-relative paths that break
// under Next.js/webpack; point them at the CDN copies instead.
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface MapMarkerProps {
  latitude: number
  longitude: number
  onDragEnd: (lat: number, lng: number) => void
}

export function MapMarker({ latitude, longitude, onDragEnd }: MapMarkerProps) {
  return (
    <Marker
      position={[latitude, longitude]}
      icon={markerIcon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target as L.Marker
          const pos = marker.getLatLng()
          onDragEnd(pos.lat, pos.lng)
        },
      }}
    />
  )
}
