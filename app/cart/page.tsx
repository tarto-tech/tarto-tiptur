'use client'

import Link from 'next/link'
import { useCart } from '@/components/CartContext'

export default function CartPage() {
  const { items, remove, updateQty, total } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Add some products to get started.</p>
        <Link href="/" className="bg-[#2D6A4F] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#245a42] transition-colors">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <ul className="divide-y bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">₹{item.price} / {item.unit}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100">−</button>
              <span className="w-6 text-center">{item.qty}</span>
              <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100">+</button>
            </div>
            <p className="w-16 text-right font-semibold text-[#2D6A4F]">₹{(item.price * item.qty).toFixed(2)}</p>
            <button onClick={() => remove(item.id)} className="text-gray-300 hover:text-red-400 ml-1">✕</button>
          </li>
        ))}
      </ul>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex justify-between text-lg font-bold mb-4">
          <span>Total</span>
          <span className="text-[#2D6A4F]">₹{total.toFixed(2)}</span>
        </div>
        <Link href="/checkout" className="block w-full bg-[#2D6A4F] text-white text-center py-3 rounded-xl font-medium hover:bg-[#245a42] transition-colors">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  )
}
