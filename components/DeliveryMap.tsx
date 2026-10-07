'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onZoneResult: (lat: number, lng: number, zone: { id: string; city: string } | null) => void
}

const DEFAULT_LAT = 13.2575
const DEFAULT_LNG = 76.4800

export default function DeliveryMap({ onZoneResult }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [locating, setLocating] = useState(false)
  const [status, setStatus] = useState<'idle' | 'checking' | 'inside' | 'outside'>('idle')
  const [cityName, setCityName] = useState('')
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function checkZone(lat: number, lng: number) {
    setStatus('checking')
    if (checkTimeout.current) clearTimeout(checkTimeout.current)
    checkTimeout.current = setTimeout(async () => {
      const { data } = await supabase.rpc('check_delivery_zone', { user_lat: lat, user_lng: lng } as any)
      const rows = data as { zone_id: string; city_name: string }[] | null
      if (rows && rows.length > 0) {
        setStatus('inside')
        setCityName(rows[0].city_name)
        onZoneResult(lat, lng, { id: rows[0].zone_id, city: rows[0].city_name })
      } else {
        setStatus('outside')
        onZoneResult(lat, lng, null)
      }
    }, 500)
  }

  useEffect(() => {
    if (typeof window === 'undefined' || mapInstanceRef.current) return

    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if ((mapRef.current as any)._leaflet_id) return
      const map = L.map(mapRef.current!).setView([DEFAULT_LAT, DEFAULT_LNG], 14)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      const marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { draggable: true }).addTo(map)
      markerRef.current = marker
      checkZone(DEFAULT_LAT, DEFAULT_LNG)

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng()
        checkZone(lat, lng)
      })

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng)
        checkZone(e.latlng.lat, e.latlng.lng)
      })
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  function useMyLocation() {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        markerRef.current?.setLatLng([lat, lng])
        mapInstanceRef.current?.setView([lat, lng], 15)
        checkZone(lat, lng)
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  return (
    <div className="space-y-2">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="relative">
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
      <div className="text-sm min-h-[20px]">
        {status === 'checking' && <span className="text-gray-400">Checking delivery zone…</span>}
        {status === 'idle' && <span className="text-gray-400">Tap the map or drag the pin to your location</span>}
        {status === 'inside' && <span className="text-[#2D6A4F] font-medium">✓ Delivering to {cityName}</span>}
        {status === 'outside' && <span className="text-red-500 font-medium">⚠ Sorry, we don't deliver to your area yet</span>}
      </div>
    </div>
  )
}
