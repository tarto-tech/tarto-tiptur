import { createServerClient } from '@/lib/supabase'
import type { OrderItem } from '@/lib/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const STATUS_LABELS: Record<string, string> = {
  new: '🕐 Order received',
  preparing: '👨‍🍳 Preparing your order',
  out_for_delivery: '🛵 Out for delivery',
  delivered: '✅ Delivered',
  cancelled: '❌ Cancelled',
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const result = await (supabase
    .from('orders') as any)
    .select('*')
    .eq('id', id)
    .single()
  const order = result.data as import('@/lib/types').Order | null

  if (!order) notFound()

  const items = order.items as OrderItem[]

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <p className="text-5xl mb-3">🎉</p>
        <h1 className="text-2xl font-bold">Order Placed!</h1>
        <p className="text-gray-500 text-sm mt-1">Order #{order.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y">
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-1">Status</p>
          <p className="font-semibold">{STATUS_LABELS[order.status] ?? order.status}</p>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-500 mb-1">Delivering to</p>
          <p className="font-medium">{order.customer_name}</p>
          <p className="text-sm text-gray-600">{order.delivery_address_text}</p>
          <p className="text-sm text-gray-500">{order.customer_phone}</p>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-500 mb-2">Items</p>
          <ul className="space-y-1 text-sm">
            {items.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>{item.name} × {item.qty}</span>
                <span className="text-gray-600">₹{(item.price * item.qty).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-[#2D6A4F]">₹{Number(order.total_amount).toFixed(2)}</span>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-500">💵 Cash on Delivery</p>
        </div>
      </div>

      <Link href="/" className="block mt-6 text-center text-[#2D6A4F] font-medium hover:underline">
        ← Back to shop
      </Link>
    </div>
  )
}
