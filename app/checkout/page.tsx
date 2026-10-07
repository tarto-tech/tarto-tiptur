'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useCart } from '@/components/CartContext'

const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), { ssr: false })

interface Zone { id: string; city: string }

declare global {
  interface Window { Razorpay: any }
}

type PaymentMethod = 'cod' | 'upi'

export default function CheckoutPage() {
  const { items, total, clear } = useCart()
  const router = useRouter()

  const [coords, setCoords] = useState({ lat: 13.2575, lng: 76.4800 })
  const [zone, setZone] = useState<Zone | null | 'outside'>('outside')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleZoneResult = useCallback((lat: number, lng: number, z: Zone | null) => {
    setCoords({ lat, lng })
    setZone(z ?? 'outside')
  }, [])

  async function loadRazorpayScript(): Promise<boolean> {
    if (window.Razorpay) return true
    return new Promise(resolve => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!zone || zone === 'outside' || items.length === 0) return
    setLoading(true)
    setError('')

    const payload = {
      amount: total,
      items,
      customerDetails: { name, phone, address },
      coords,
      zoneId: typeof zone === 'object' ? zone.id : '',
    }

    try {
      if (paymentMethod === 'cod') {
        // ── Cash on Delivery ──────────────────────────────────────────────
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        clear()
        router.push(`/order/${data.orderId}`)

      } else {
        // ── UPI / Card via Razorpay ───────────────────────────────────────
        const res = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const orderData = await res.json()
        if (!res.ok) throw new Error(orderData.error)

        const loaded = await loadRazorpayScript()
        if (!loaded) throw new Error('Failed to load payment SDK')

        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.razorpayOrderId,
          name: 'Tarto',
          description: 'Fresh delivery — Tiptur',
          prefill: { name, contact: phone },
          theme: { color: '#2D6A4F' },
          handler: async (response: any) => {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: orderData.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(verifyData.error)
            clear()
            router.push(`/order/${orderData.orderId}`)
          },
          modal: { ondismiss: () => setLoading(false) },
        })
        rzp.open()
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Your cart is empty. <a href="/" className="text-emerald-700 underline">Go back</a></p>
      </div>
    )
  }

  const canSubmit = zone && zone !== 'outside' && name && phone && address

  return (
    <div className="max-w-lg mx-auto px-4 py-10 pb-20">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Map */}
        <div>
          <label className="block text-sm font-medium mb-2">Drop a pin at your delivery location</label>
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
            <label className="block text-sm font-medium mb-1">Delivery address / landmark</label>
            <textarea required value={address} onChange={e => setAddress(e.target.value)} placeholder="House no, street, landmark…" rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none" />
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-sm font-medium mb-2">Payment method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cod')}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'cod'
                  ? 'border-emerald-700 bg-emerald-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">💵</span>
              <span className="font-bold text-sm text-gray-900">Cash on Delivery</span>
              <span className="text-[11px] text-gray-500">Pay when delivered</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'upi'
                  ? 'border-emerald-700 bg-emerald-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">📱</span>
              <span className="font-bold text-sm text-gray-900">UPI / Card</span>
              <span className="text-[11px] text-gray-500">Pay now via Razorpay</span>
            </button>
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
          disabled={loading || !canSubmit}
          className="w-full bg-emerald-800 text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? 'Placing order…'
            : paymentMethod === 'cod'
              ? `Place Order — Pay ₹${total.toFixed(2)} on Delivery`
              : `Pay ₹${total.toFixed(2)} via UPI / Card`}
        </button>
      </form>
    </div>
  )
}
