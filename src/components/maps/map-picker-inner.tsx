'use client'

import * as React from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import type L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapMarker } from './MapMarker'
import { MapControls } from './MapControls'
import { mapConfig } from '@/lib/maps/config'

interface MapPickerInnerProps {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number, lng: number) => void
  onRecenter: () => void
  locating?: boolean
  className?: string
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function MapPickerInner({
  latitude,
  longitude,
  onChange,
  onRecenter,
  locating,
  className,
}: MapPickerInnerProps) {
  const defaultCenter: [number, number] = [mapConfig.defaultCenter.lat, mapConfig.defaultCenter.lng]
  const center: [number, number] = latitude != null && longitude != null ? [latitude, longitude] : defaultCenter
  const mapRef = React.useRef<L.Map | null>(null)

  React.useEffect(() => {
    if (latitude != null && longitude != null) {
      mapRef.current?.setView([latitude, longitude], mapRef.current.getZoom())
    }
  }, [latitude, longitude])

  return (
    <div className={`relative ${className ?? ''}`}>
      <MapContainer
        center={center}
        zoom={latitude != null ? mapConfig.pinZoom : mapConfig.defaultZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer attribution={mapConfig.tileAttribution} url={mapConfig.tileUrl} />
        <ClickHandler onChange={onChange} />
        {latitude != null && longitude != null && (
          <MapMarker latitude={latitude} longitude={longitude} onDragEnd={onChange} />
        )}
      </MapContainer>
      <MapControls onRecenter={onRecenter} locating={locating} />
    </div>
  )
}
