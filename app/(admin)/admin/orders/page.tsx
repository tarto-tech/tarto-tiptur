'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Order, OrderStatus, OrderItem } from '@/lib/types'

type OrderWithItems = Order & {
  order_items: (OrderItem & { products: { name: string; unit: string } })[]
}

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all',             label: 'All'            },
  { key: 'placed',          label: 'Placed'         },
  { key: 'preparing',       label: 'Preparing'      },
  { key: 'out_for_delivery',label: 'Out for Delivery'},
  { key: 'delivered',       label: 'Delivered'      },
]

const STATUS_BADGE: Record<OrderStatus, string> = {
  placed:           'bg-blue-100 text-blue-700',
  preparing:        'bg-orange-100 text-orange-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered:        'bg-green-100 text-green-700',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed:           'Placed',
  preparing:        'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
}

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  placed:           ['preparing'],
  preparing:        ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered:        [],
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [tab, setTab] = useState<OrderStatus | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    const { data } = await (supabase.from('orders') as any)
      .select('*, order_items(*, products(name, unit))')
      .order('created_at', { ascending: false })
    if (data) setOrders(data as OrderWithItems[])
  }, [])

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchOrders])

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId)
    await (supabase.from('orders') as any).update({ order_status: status }).eq('id', orderId)
    await fetchOrders()
    setUpdating(null)
  }

  const filtered = tab === 'all' ? orders : orders.filter(o => o.order_status === tab)

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Orders</h1>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap mb-4">
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-[#2D6A4F] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
            {(() => {
              const count = t.key === 'all' ? orders.length : orders.filter(o => o.order_status === t.key).length
              return count > 0 ? (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {count}
                </span>
              ) : null
            })()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm p-6 text-center">No orders</p>
        ) : (
          <div className="divide-y">
            {filtered.map(order => {
              const isOpen = expanded === order.id
              const items = order.order_items ?? []
              return (
                <div key={order.id}>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs text-gray-400 w-16 shrink-0">#{order.order_number}</span>
                      <span className="font-medium text-sm w-32 shrink-0 truncate">{order.customer_name}</span>
                      <span className="text-sm text-gray-500 hidden sm:block w-28 shrink-0">{order.phone_number}</span>
                      <span className="font-semibold text-sm text-[#2D6A4F] w-20 shrink-0 text-right">
                        ₹{Number(order.total_amount).toFixed(2)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_BADGE[order.order_status]}`}>
                        {STATUS_LABEL[order.order_status]}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                        order.payment_status === 'paid' ? 'bg-green-50 text-green-600' 
                        : order.payment_status === 'cod' ? 'bg-blue-50 text-blue-600'
                        : 'bg-yellow-50 text-yellow-600'
                      }`}>
                        {order.payment_status === 'paid' ? '✓ Paid' : order.payment_status === 'cod' ? '💵 COD' : '⏳ Pending'}
                      </span>
                      <span className="text-xs text-gray-400 hidden lg:block shrink-0">{formatTime(order.created_at)}</span>
                      <span className="text-gray-400 text-xs ml-auto">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                      <div className="grid sm:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Customer</p>
                          <p className="text-sm font-medium">{order.customer_name}</p>
                          <a href={`tel:${order.phone_number}`} className="text-sm text-[#2D6A4F] underline">{order.phone_number}</a>
                          <p className="text-sm text-gray-600 mt-1">{order.address_notes}</p>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-500 underline mt-1 inline-block"
                          >
                            🗺 Open directions
                          </a>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Items</p>
                          <ul className="space-y-0.5 text-sm mb-3">
                            {items.map(item => (
                              <li key={item.id} className="flex justify-between">
                                <span>{item.products?.name} × {item.quantity}</span>
                                <span className="text-gray-500">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-between font-semibold text-sm border-t pt-2">
                            <span>Total</span>
                            <span className="text-[#2D6A4F]">₹{Number(order.total_amount).toFixed(2)}</span>
                          </div>
                          {order.razorpay_payment_id && (
                            <p className="text-xs text-gray-400 mt-1">Payment: {order.razorpay_payment_id}</p>
                          )}
                        </div>
                      </div>

                      {NEXT_STATUSES[order.order_status].length > 0 && (
                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500">Update status:</span>
                          {NEXT_STATUSES[order.order_status].map(s => (
                            <button
                              key={s}
                              disabled={updating === order.id}
                              onClick={() => updateStatus(order.id, s)}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium border border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white transition-colors disabled:opacity-50"
                            >
                              {updating === order.id ? '…' : `→ ${STATUS_LABEL[s]}`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
