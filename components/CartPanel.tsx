'use client'

import Link from 'next/link'
import { useCart } from './CartContext'

export default function CartPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, remove, updateQty, total } = useCart()

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Your cart is empty</div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y">
              {items.map(item => (
                <li key={item.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">₹{item.price} / {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded-full border flex items-center justify-center text-lg leading-none hover:bg-gray-100">−</button>
                    <span className="w-5 text-center text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-7 h-7 rounded-full border flex items-center justify-center text-lg leading-none hover:bg-gray-100">+</button>
                  </div>
                  <button onClick={() => remove(item.id)} className="text-gray-300 hover:text-red-400 ml-1">✕</button>
                </li>
              ))}
            </ul>
            <div className="p-4 border-t">
              <div className="flex justify-between mb-3 font-semibold">
                <span>Total</span>
                <span className="text-[#2D6A4F]">₹{total.toFixed(2)}</span>
              </div>
              <Link href="/checkout" onClick={onClose} className="block w-full bg-[#2D6A4F] text-white text-center py-3 rounded-xl font-medium hover:bg-[#245a42] transition-colors">
                Proceed to Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
