'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onLocationSelect: (lat: number, lng: number) => void
}

// Tiptur center
const DEFAULT_LAT = 13.2563
const DEFAULT_LNG = 76.4762

export default function MapPicker({ onLocationSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || mapInstanceRef.current) return

    import('leaflet').then(L => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([DEFAULT_LAT, DEFAULT_LNG], 13)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      const marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { draggable: true }).addTo(map)
      markerRef.current = marker
      onLocationSelect(DEFAULT_LAT, DEFAULT_LNG)

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng()
        onLocationSelect(lat, lng)
      })

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng)
        onLocationSelect(e.latlng.lat, e.latlng.lng)
      })
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [onLocationSelect])

  function useMyLocation() {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        markerRef.current?.setLatLng([lat, lng])
        mapInstanceRef.current?.setView([lat, lng], 15)
        onLocationSelect(lat, lng)
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  return (
    <div className="relative">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="h-64 w-full rounded-xl overflow-hidden border border-gray-200" />
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="absolute bottom-3 left-3 z-[1000] bg-white text-sm px-3 py-1.5 rounded-lg shadow border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
      >
        {locating ? 'Locating…' : '📍 Use my location'}
      </button>
    </div>
  )
}
