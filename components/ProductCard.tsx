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
          <div className="flex items-center justify-center h-full text-4xl">🛒</div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-500 mt-0.5 flex-1">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-lg font-bold text-[#2D6A4F]">₹{product.price}</span>
            <span className="text-xs text-gray-400 ml-1">/ {product.unit}</span>
          </div>
          {product.in_stock ? (
            <button
              onClick={() => add(product)}
              className="bg-[#2D6A4F] text-white text-sm px-3 py-1.5 rounded-xl hover:bg-[#245a42] transition-colors"
            >
              {inCart ? `In cart (${inCart.qty})` : 'Add'}
            </button>
          ) : (
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">Out of stock</span>
          )}
        </div>
      </div>
    </div>
  )
}
