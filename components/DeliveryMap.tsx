'use client'

import { useState } from 'react'
import { MapPin, Navigation, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  onZoneResult: (lat: number, lng: number, zone: { id: string; city: string } | null) => void
}

export default function DeliveryMap({ onZoneResult }: Props) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'denied' | 'outside'>('idle')
  const [message, setMessage] = useState('')

  function fetchLocation() {
    if (!navigator.geolocation) {
      setStatus('denied')
      setMessage('Geolocation is not supported by your browser.')
      return
    }
    setLoading(true)
    setStatus('idle')

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude, accuracy } }) => {
        const { data, error } = await supabase.rpc('check_delivery_zone', {
          user_lat: latitude,
          user_lng: longitude,
        } as any)
        setLoading(false)
        const rows = data as { zone_id: string; city_name: string }[] | null
        if (error || !rows || rows.length === 0) {
          setStatus('outside')
          setMessage(error?.message ?? "You are currently outside our delivery zone.")
          onZoneResult(latitude, longitude, null)
        } else {
          setStatus('success')
          setMessage(`Verified: ${rows[0].city_name} (±${Math.round(accuracy)}m)`)
          onZoneResult(latitude, longitude, { id: rows[0].zone_id, city: rows[0].city_name })
        }
      },
      (err) => {
        setLoading(false)
        setStatus('denied')
        setMessage(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please allow access in your browser settings.'
            : 'Unable to get location. Ensure your device GPS is on.'
        )
        onZoneResult(0, 0, null)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
      <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
        <MapPin className="w-4 h-4 text-emerald-600" />
        Delivery Location (GPS Required)
      </label>

      {status !== 'success' && (
        <button
          type="button"
          onClick={fetchLocation}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-60"
        >
          <Navigation className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Detecting location…' : 'Allow GPS & Verify Location'}
        </button>
      )}

      {status === 'success' && (
        <div className="flex items-start gap-2 bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">GPS Location Verified</p>
            <p className="text-emerald-700 mt-0.5">{message}</p>
          </div>
        </div>
      )}

      {status === 'denied' && (
        <div className="flex items-start gap-2 bg-red-50 text-red-900 p-3 rounded-xl border border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Permission Required</p>
            <p className="text-red-700 mt-0.5">{message}</p>
          </div>
        </div>
      )}

      {status === 'outside' && (
        <div className="flex items-start gap-2 bg-amber-50 text-amber-900 p-3 rounded-xl border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Outside Service Area</p>
            <p className="text-amber-800 mt-0.5">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
