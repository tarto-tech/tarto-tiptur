'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from './CartContext'
import CartPanel from './CartPanel'

export default function Navbar() {
  const { count } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <>
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#2D6A4F] tracking-tight">tarto</Link>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-1.5 bg-[#2D6A4F] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#245a42] transition-colors"
          >
            🛒 Cart
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#F4A261] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </button>
        </div>
      </nav>
      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
