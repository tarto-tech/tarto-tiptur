'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const DROP_LIMIT = 49

export default function LiveStockTicker({ initial }: { initial: number }) {
  const [remaining, setRemaining] = useState(initial)

  useEffect(() => {
    // Realtime: recount whenever an order is inserted or updated to 'paid'
    const channel = supabase
      .channel('drop-stock')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const { data } = await supabase.rpc('get_drop_order_count' as any)
        setRemaining(Math.max(0, DROP_LIMIT - ((data as unknown as number) ?? 0)))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const sold = DROP_LIMIT - remaining
  const pct = Math.min(100, Math.round((sold / DROP_LIMIT) * 100))
  const soldOut = remaining === 0

  return (
    <div className={`mx-4 mt-3 rounded-2xl overflow-hidden border ${soldOut ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'}`}>
      {/* Top strip */}
      <div className={`px-4 py-2.5 flex items-center justify-between ${soldOut ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}>
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-black tracking-tight">
            {soldOut ? '🚫 SOLD OUT' : '🔥 LAUNCH DROP'}
          </span>
          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            LIMITED
          </span>
        </div>
        {!soldOut && (
          <span className="text-white font-black text-sm">
            {remaining} <span className="font-medium text-white/80 text-xs">of {DROP_LIMIT} left</span>
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {soldOut ? (
          <>
            <p className="text-gray-900 font-black text-sm leading-snug">
              Veg Cheese Pizza @ <span className="text-gray-700">₹199</span>
              <span className="ml-1.5 text-red-400 line-through font-normal text-xs">₹129 offer</span>
            </p>
            <p className="text-[11px] text-red-600 mt-1 font-semibold">
              🚫 Launch offer closed — all 49 pizzas claimed! Now available at regular price ₹199.
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-900 font-black text-sm leading-snug">
              Veg Cheese Pizza @ <span className="text-emerald-700">₹129 flat</span>
              <span className="ml-1.5 text-gray-400 line-through font-normal text-xs">₹199</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
              ✅ FREE Delivery &nbsp;·&nbsp; Zero Platform Fees &nbsp;·&nbsp; No Hidden Charges
            </p>
            <div className="mt-2.5">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                {sold} sold · <span className="text-orange-600 font-bold">ONLY {remaining} OF {DROP_LIMIT} LEFT!</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
