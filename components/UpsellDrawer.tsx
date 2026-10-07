'use client'

import { useCart } from './CartContext'
import type { Product } from '@/lib/types'

interface Props {
  upsells: Product[]
  onClose: () => void
}

export default function UpsellDrawer({ upsells, onClose }: Props) {
  const { add } = useCart()

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl p-5 pb-8 shadow-2xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <p className="text-base font-black text-gray-900 mb-0.5">Complete your meal? 🍟</p>
        <p className="text-xs text-gray-500 mb-4">Add a drink or crispy fries to your order!</p>
        <div className="flex flex-col gap-3">
          {upsells.map(product => (
            <div key={product.id} className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
              <div>
                <p className="font-bold text-sm text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">{product.unit}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-emerald-700">₹{product.price}</span>
                <button
                  onClick={() => { add(product); onClose() }}
                  className="bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition"
                >
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-sm text-gray-400 font-medium py-2"
        >
          No thanks, continue to checkout →
        </button>
      </div>
    </div>
  )
}
