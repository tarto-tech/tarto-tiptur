'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useCart } from '@/components/CartContext'
import { supabase } from '@/lib/supabase'
import type { Order, ServiceZone } from '@/lib/types'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

type ZoneState = { id: string; city: string } | 'outside' | null

export default function CheckoutPage() {
  const { items, total, clear } = useCart()
  const router = useRouter()

  const [lat, setLat] = useState(13.2563)
  const [lng, setLng] = useState(76.4762)
  const [zone, setZone] = useState<ZoneState>(null)
  const [checking, setChecking] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLocationSelect = useCallback(async (newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
    setZone(null)

    if (checkTimeout.current) clearTimeout(checkTimeout.current)
    checkTimeout.current = setTimeout(async () => {
      setChecking(true)
      const { data } = await supabase.rpc('is_within_service_zone', { lat: newLat, lng: newLng } as any)
      if (data) {
        const { data: zoneData } = await supabase
          .from('service_zones')
          .select('id, city_name')
          .eq('id', data as string)
          .single()
        const z = zoneData as Pick<ServiceZone, 'id' | 'city_name'> | null
        setZone(z ? { id: z.id, city: z.city_name } : 'outside')
      } else {
        setZone('outside')
      }
      setChecking(false)
    }, 600)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!zone || zone === 'outside') return
    if (items.length === 0) return

    setSubmitting(true)
    setError('')

    const result = await (supabase
      .from('orders') as any)
      .insert({
        customer_name: name,
        customer_phone: phone,
        delivery_lat: lat,
        delivery_lng: lng,
        delivery_address_text: address,
        service_zone_id: zone.id,
        items: items.map(i => ({ product_id: i.id, name: i.name, price: i.price, qty: i.qty })),
        total_amount: total,
      })
      .select('id')
      .single()
    const data = result.data as Pick<Order, 'id'> | null
    const err = result.error

    if (err || !data) {
      setError('Failed to place order. Please try again.')
      setSubmitting(false)
      return
    }

    clear()
    router.push(`/order/${data.id}`)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Your cart is empty. <a href="/" className="text-[#2D6A4F] underline">Go back</a></p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Map */}
        <div>
          <label className="block text-sm font-medium mb-2">Drop a pin at your delivery location</label>
          <MapPicker onLocationSelect={handleLocationSelect} />
          <div className="mt-2 text-sm">
            {checking && <span className="text-gray-400">Checking delivery zone…</span>}
            {!checking && zone === null && <span className="text-gray-400">Move the pin to your location</span>}
            {!checking && zone === 'outside' && (
              <span className="text-red-500 font-medium">⚠ Sorry, we don't deliver to your area yet</span>
            )}
            {!checking && zone && zone !== 'outside' && (
              <span className="text-[#2D6A4F] font-medium">✓ Delivering to {zone.city}</span>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Your name</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone number</label>
            <input
              required
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Delivery address (text)</label>
            <textarea
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="House no, street, landmark…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] resize-none"
            />
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-semibold mb-3">Order Summary</h2>
          <ul className="space-y-1 text-sm text-gray-600 mb-3">
            {items.map(i => (
              <li key={i.id} className="flex justify-between">
                <span>{i.name} × {i.qty}</span>
                <span>₹{(i.price * i.qty).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span className="text-[#2D6A4F]">₹{total.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">💵 Cash on Delivery</p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !zone || zone === 'outside'}
          className="w-full bg-[#2D6A4F] text-white py-3 rounded-xl font-medium hover:bg-[#245a42] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Placing order…' : 'Place Order'}
        </button>
      </form>
    </div>
  )
}
