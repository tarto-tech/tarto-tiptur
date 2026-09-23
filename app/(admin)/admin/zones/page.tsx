'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ServiceZone } from '@/lib/types'

type ZoneForm = { city_name: string; center_lat: string; center_lng: string; radius_km: string }
const EMPTY_FORM: ZoneForm = { city_name: '', center_lat: '', center_lng: '', radius_km: '' }

export default function AdminZonesPage() {
  const [zones, setZones] = useState<ServiceZone[]>([])
  const [form, setForm] = useState<ZoneForm>(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function fetchZones() {
    const { data } = await (supabase.from('service_zones') as any).select('*').order('created_at')
    if (data) setZones(data as ServiceZone[])
  }

  useEffect(() => { fetchZones() }, [])

  async function toggleActive(zone: ServiceZone) {
    await (supabase.from('service_zones') as any)
      .update({ is_active: !zone.is_active })
      .eq('id', zone.id)
    setZones(prev => prev.map(z => z.id === zone.id ? { ...z, is_active: !z.is_active } : z))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await (supabase.from('service_zones') as any).insert({
      city_name: form.city_name,
      center_lat: parseFloat(form.center_lat),
      center_lng: parseFloat(form.center_lng),
      radius_km: parseFloat(form.radius_km),
      is_active: true,
    })
    await fetchZones()
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Delivery Zones</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#2D6A4F] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#245a42] transition-colors"
        >
          + Add zone
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAdd}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <h2 className="font-semibold text-lg">Add delivery zone</h2>
            <div>
              <label className="block text-sm font-medium mb-1">City name</label>
              <input
                required
                value={form.city_name}
                onChange={e => setForm(f => ({ ...f, city_name: e.target.value }))}
                placeholder="e.g. Tiptur"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Center latitude</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={form.center_lat}
                  onChange={e => setForm(f => ({ ...f, center_lat: e.target.value }))}
                  placeholder="13.2563"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Center longitude</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={form.center_lng}
                  onChange={e => setForm(f => ({ ...f, center_lng: e.target.value }))}
                  placeholder="76.4762"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Radius (km)</label>
              <input
                required
                type="number"
                min="0.1"
                step="0.1"
                value={form.radius_km}
                onChange={e => setForm(f => ({ ...f, radius_km: e.target.value }))}
                placeholder="8"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
            <p className="text-xs text-gray-400">
              Tip: Find lat/lng by right-clicking any location on Google Maps.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#2D6A4F] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#245a42] disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Add zone'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {zones.length === 0 ? (
          <p className="text-gray-400 text-sm p-6 text-center">No zones</p>
        ) : (
          <div className="divide-y">
            {zones.map(zone => (
              <div key={zone.id} className="flex items-center gap-4 px-4 py-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{zone.city_name}</p>
                  <p className="text-xs text-gray-400">
                    {zone.center_lat.toFixed(4)}, {zone.center_lng.toFixed(4)} · {zone.radius_km} km radius
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(zone)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                    zone.is_active ? 'bg-[#2D6A4F]' : 'bg-gray-200'
                  }`}
                  title={zone.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    zone.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-xs text-gray-400 w-16 shrink-0">
                  {zone.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
