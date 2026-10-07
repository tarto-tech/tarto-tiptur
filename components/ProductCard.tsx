'use client'

import Image from 'next/image'
import { useCart } from './CartContext'
import type { Product } from '@/lib/types'

export default function ProductCard({ product }: { product: Product }) {
  const { add, items } = useCart()
  const inCart = items.find(i => i.id === product.id)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="relative h-40 bg-gray-50">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl select-none">
            {product.category === 'Pizza & Snacks' ? '🍕' : product.category === 'Bakery' ? '🍞' : '🛒'}
          </div>
        )}
        <span className="absolute top-2 left-2 bg-white/80 backdrop-blur text-[10px] font-medium text-gray-500 px-2 py-0.5 rounded-full">
          {product.category}
        </span>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-400 mt-0.5 flex-1 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-base font-bold text-[#2D6A4F]">₹{product.price}</span>
            <span className="text-xs text-gray-400 ml-1">{product.unit}</span>
          </div>
          {product.is_in_stock ? (
            <button
              onClick={() => add(product)}
              className="bg-[#2D6A4F] text-white text-xs px-3 py-1.5 rounded-xl hover:bg-[#245a42] transition-colors font-medium"
            >
              {inCart ? `+${inCart.qty}` : 'Add'}
            </button>
          ) : (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1.5 rounded-xl">Out of stock</span>
          )}
        </div>
      </div>
    </div>
  )
}
