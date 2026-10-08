'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useCart } from '@/components/CartContext'

const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), { ssr: false })

interface Zone { id: string; city: string }

export default function CheckoutPage() {
  const { items, total, clear } = useCart()
  const router = useRouter()

  const [coords, setCoords] = useState({ lat: 13.2561, lng: 76.4760 })
  const [zone, setZone] = useState<Zone | null | 'outside'>('outside')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleZoneResult = useCallback((lat: number, lng: number, z: Zone | null) => {
    if (lat !== 0 || lng !== 0) setCoords({ lat, lng })
    setZone(z ?? 'outside')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!zone || zone === 'outside' || items.length === 0 || isSubmitting) return
    setIsSubmitting(true)
    setLoading(true)
    setError('')

    const cleanPhone = phone.replace(/\D/g, '').slice(-10)
    const payload = {
      amount: total,
      items,
      customerDetails: { name, phone: cleanPhone, address },
      coords,
      zoneId: typeof zone === 'object' ? zone.id : '',
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      clear()
      router.push(`/order/${data.orderId}`)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Your cart is empty. <a href="/" className="text-emerald-700 underline">Go back</a></p>
      </div>
    )
  }

  const canSubmit = zone && zone !== 'outside' && name && phone.replace(/\D/g, '').length >= 10 && address.trim().length >= 5

  return (
    <div className="max-w-lg mx-auto px-4 py-10 pb-20">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Map */}
        <div>
          <label className="block text-sm font-medium mb-2">Verify your delivery location via GPS</label>
          <DeliveryMap onZoneResult={handleZoneResult} />
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Your name</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone number</label>
            <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile number"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">House no. / Flat / Landmark <span className="text-red-500">*</span></label>
            <textarea required minLength={5} value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. #12, 2nd Cross, near Water Tank…" rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none" />
          </div>
        </div>

        {/* Payment method — COD only */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <span className="text-2xl">💵</span>
          <div>
            <p className="font-bold text-sm text-gray-900">Cash on Delivery</p>
            <p className="text-[11px] text-gray-500">Pay when your order arrives</p>
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
          <div className="space-y-1.5 border-t pt-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery Fee</span>
              <span className="text-emerald-600 font-medium">₹0 (FREE 🎉)</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Platform Fee</span>
              <span className="text-emerald-600 font-medium">₹0</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
              <span>Total to Pay</span>
              <span className="text-emerald-700">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || isSubmitting || !canSubmit}
          className="w-full bg-emerald-800 text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Placing order…' : `Place Order — Pay ₹${total.toFixed(2)} on Delivery`}
        </button>
      </form>
    </div>
  )
}
