'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Order, OrderStatus, OrderItem } from '@/lib/types'

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

const STATUS_BADGE: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'New',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  new: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

function itemsSummary(items: OrderItem[]) {
  return items.map(i => `${i.name} ×${i.qty}`).join(', ')
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<OrderStatus | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    const { data } = await (supabase.from('orders') as any)
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setOrders(data as Order[])
  }, [])

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchOrders])

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId)
    await (supabase.from('orders') as any).update({ status }).eq('id', orderId)
    await fetchOrders()
    setUpdating(null)
  }

  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab)

  const tabCounts = Object.fromEntries(
    STATUS_TABS.map(t => [t.key, t.key === 'all' ? orders.length : orders.filter(o => o.status === t.key).length])
  )

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
            {tabCounts[t.key] > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                {tabCounts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm p-6 text-center">No orders</p>
        ) : (
          <div className="divide-y">
            {filtered.map(order => {
              const isOpen = expanded === order.id
              const items = order.items as OrderItem[]
              return (
                <div key={order.id}>
                  {/* Row */}
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs text-gray-400 w-20 shrink-0">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="font-medium text-sm w-32 shrink-0 truncate">{order.customer_name}</span>
                      <span className="text-sm text-gray-500 hidden sm:block w-28 shrink-0">{order.customer_phone}</span>
                      <span className="text-xs text-gray-400 flex-1 truncate hidden md:block">{itemsSummary(items)}</span>
                      <span className="font-semibold text-sm text-[#2D6A4F] w-20 shrink-0 text-right">
                        ₹{Number(order.total_amount).toFixed(2)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_BADGE[order.status]}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                      <span className="text-xs text-gray-400 hidden lg:block shrink-0">{formatTime(order.created_at)}</span>
                      <span className="text-gray-400 text-xs ml-auto">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                      <div className="grid sm:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Customer</p>
                          <p className="text-sm font-medium">{order.customer_name}</p>
                          <a href={`tel:${order.customer_phone}`} className="text-sm text-[#2D6A4F] underline">
                            {order.customer_phone}
                          </a>
                          <p className="text-sm text-gray-600 mt-1">{order.delivery_address_text}</p>
                          <a
                            href={`https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 underline mt-1 inline-block"
                          >
                            📍 View on map
                          </a>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Items</p>
                          <ul className="space-y-0.5 text-sm mb-3">
                            {items.map((item, i) => (
                              <li key={i} className="flex justify-between">
                                <span>{item.name} × {item.qty}</span>
                                <span className="text-gray-500">₹{(item.price * item.qty).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-between font-semibold text-sm border-t pt-2">
                            <span>Total</span>
                            <span className="text-[#2D6A4F]">₹{Number(order.total_amount).toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">💵 Cash on Delivery · {formatTime(order.created_at)}</p>
                        </div>
                      </div>

                      {/* Status update */}
                      {NEXT_STATUSES[order.status].length > 0 && (
                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500">Update status:</span>
                          {NEXT_STATUSES[order.status].map(s => (
                            <button
                              key={s}
                              disabled={updating === order.id}
                              onClick={() => updateStatus(order.id, s)}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors disabled:opacity-50 ${
                                s === 'cancelled'
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white'
                              }`}
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
