import { createServerClient } from '@/lib/supabase'
import type { Order, OrderItem } from '@/lib/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const STEPS = [
  { key: 'placed',            label: 'Payment Confirmed' },
  { key: 'preparing',         label: 'Preparing'         },
  { key: 'out_for_delivery',  label: 'Out for Delivery'  },
  { key: 'delivered',         label: 'Delivered'         },
]

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const orderResult = await (supabase.from('orders') as any)
    .select('*').eq('id', id).single()
  const order = orderResult.data as Order | null
  if (!order) notFound()

  const itemsResult = await (supabase.from('order_items') as any)
    .select('*, products(name, unit)').eq('order_id', id)
  const orderItems = (itemsResult.data ?? []) as (OrderItem & { products: { name: string; unit: string } })[]

  const currentStep = STEPS.findIndex(s => s.key === order.order_status)
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-5xl mb-3">{order.payment_status === 'paid' ? '🎉' : '⏳'}</p>
        <h1 className="text-2xl font-bold">
          {order.payment_status === 'paid' ? 'Order Confirmed!' : 'Payment Pending'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Order #{order.order_number}</p>
        {order.razorpay_payment_id && (
          <p className="text-xs text-gray-400 mt-0.5">Payment ID: {order.razorpay_payment_id}</p>
        )}
      </div>

      {/* Status stepper */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-start justify-between">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                i <= currentStep ? 'bg-[#2D6A4F] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              <p className={`text-center text-[10px] leading-tight ${i <= currentStep ? 'text-[#2D6A4F] font-medium' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {i < STEPS.length - 1 && (
                <div className={`absolute hidden`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Order details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y mb-4">
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-1">Delivering to</p>
          <p className="font-medium">{order.customer_name}</p>
          <p className="text-sm text-gray-600">{order.address_notes}</p>
          <p className="text-sm text-gray-500">{order.phone_number}</p>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-500 mb-2">Items</p>
          <ul className="space-y-1 text-sm">
            {orderItems.map(item => (
              <li key={item.id} className="flex justify-between">
                <span>{item.products?.name} × {item.quantity}</span>
                <span className="text-gray-600">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 flex justify-between font-bold">
          <span>Total Paid</span>
          <span className="text-[#2D6A4F]">₹{Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {/* Rider directions link (visible to admin/rider) */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-[#F4A261] text-white py-3 rounded-xl font-medium hover:bg-[#e8924f] transition-colors mb-4"
      >
        🗺 Open Directions for Rider
      </a>

      <Link href="/" className="block text-center text-[#2D6A4F] font-medium hover:underline">
        ← Back to shop
      </Link>
    </div>
  )
}
