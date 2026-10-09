'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Zap, ArrowRight, Minus, Plus } from 'lucide-react'
import { useCart } from '@/components/CartContext'
import LiveStockTicker from '@/components/LiveStockTicker'
import UpsellDrawer from '@/components/UpsellDrawer'
import type { Product } from '@/lib/types'

const CATEGORIES = ['All', 'Pizza', 'Burgers', 'Sandwiches', 'Snacks', 'Beverages']

const CAT_EMOJI: Record<string, string> = {
  Pizza: '🍕', Burgers: '🍔', Sandwiches: '🥪', Snacks: '🍟', Beverages: '🥤',
}

interface Props {
  products: Product[]
  dropRemaining: number
}

export default function StoreFront({ products, dropRemaining }: Props) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [showUpsell, setShowUpsell] = useState(false)
  const [upsellShown, setUpsellShown] = useState(false)
  const { items, add, updateQty, total, count } = useCart()

  const dropProduct = products.find(p => p.is_drop_offer)
  const dropSoldOut = dropRemaining === 0

  const upsellProducts = products.filter(p =>
    !p.is_drop_offer && (p.category === 'Snacks' || p.category === 'Beverages')
  ).slice(0, 2)

  const filtered = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory)

  function handleAdd(product: Product) {
    // Drop offer: max 1 per cart
    if (product.is_drop_offer) {
      const alreadyInCart = items.find(i => i.is_drop_offer)
      if (alreadyInCart) return
      if (dropSoldOut) return
    }
    add(product)

    // Show upsell drawer once when drop pizza is added
    if (product.is_drop_offer && !upsellShown && upsellProducts.length > 0) {
      setUpsellShown(true)
      setTimeout(() => setShowUpsell(true), 300)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 pb-28 antialiased">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-black text-base shadow-sm">
              T
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-gray-950">Tarto</span>
                <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200/60">
                  <Zap className="w-2.5 h-2.5 fill-current" /> Instant
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-600" /> Tiptur Town · Within 4 km
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Live Stock Ticker */}
      <LiveStockTicker initial={dropRemaining} pizzaImageUrl={dropProduct?.image_url ?? undefined} />

      {/* Hero Pizza Card */}
      {dropProduct && (
        <div className="mx-4 mt-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 shadow-lg">
            {dropProduct.image_url && (
              <img
                src={dropProduct.image_url}
                alt={dropProduct.name}
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            )}
            <div className="relative z-10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="inline-block bg-amber-400 text-emerald-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-2">
                    {dropSoldOut ? '🚫 OFFER CLOSED' : '🚀 LAUNCH OFFER'}
                  </span>
                  <h2 className="text-white font-black text-lg leading-tight">{dropProduct.name}</h2>
                  <p className="text-emerald-100/80 text-xs mt-1 leading-relaxed">
                    Freshly baked 7-inch Veg Cheese Pizza delivered straight to your door in Tiptur.
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    {dropSoldOut ? (
                      <>
                        <span className="text-white font-black text-2xl">₹199</span>
                        <span className="text-red-300 line-through text-sm font-medium">₹129 offer</span>
                        <span className="bg-red-500/50 text-red-100 text-[10px] font-bold px-2 py-0.5 rounded-full">Offer Closed</span>
                      </>
                    ) : (
                      <>
                        <span className="price-pulse text-amber-300 font-black text-3xl drop-shadow-lg">₹{dropProduct.price}</span>
                        {dropProduct.original_price && (
                          <span className="text-red-300 line-through text-sm font-medium">₹{dropProduct.original_price}</span>
                        )}
                        <span className="bg-emerald-500/40 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Save ₹{(dropProduct.original_price ?? 0) - dropProduct.price}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {/* Add button */}
                <div className="shrink-0 mt-1">
                  {(() => {
                    const cartItem = items.find(i => i.id === dropProduct.id)
                    const qty = cartItem?.qty ?? 0
                    if (dropSoldOut) {
                      return (
                        <div className="text-center">
                          <span className="bg-red-500/80 text-white text-xs font-bold px-4 py-2.5 rounded-xl block">
                            🚫 Offer Closed
                          </span>
                          <p className="text-white/60 text-[10px] mt-1">Now ₹199</p>
                        </div>
                      )
                    }
                    if (qty > 0) {
                      return (
                        <div className="flex items-center bg-white/20 text-white rounded-xl border border-white/30">
                          <button onClick={() => updateQty(dropProduct.id, qty - 1)} className="p-2 active:scale-75 transition">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-sm font-black">{qty}</span>
                          <button disabled className="p-2 opacity-40 cursor-not-allowed">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    }
                    return (
                      <button
                        onClick={() => handleAdd(dropProduct)}
                        className="add-shimmer bg-amber-400 text-emerald-950 font-black text-sm px-5 py-2.5 rounded-xl active:scale-95 transition shadow-lg"
                      >
                        ADD
                      </button>
                    )
                  })()}
                </div>
              </div>
              <div className="flex gap-3 mt-3 flex-wrap">
                {['FREE Delivery', 'Zero Fees', 'No Hidden Charges'].map(tag => (
                  <span key={tag} className="text-[10px] text-emerald-200 font-semibold flex items-center gap-1">
                    ✅ {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="sticky top-[57px] z-20 bg-[#F8F9FA]/95 backdrop-blur-md py-2 px-4 border-b border-gray-200/50 mt-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-150 active:scale-95 ${
                activeCategory === cat
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200/70 hover:bg-gray-50'
              }`}
            >
              {CAT_EMOJI[cat] ? `${CAT_EMOJI[cat]} ` : ''}{cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <main className="p-4 pt-3">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">No products in this category.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.filter(p => !p.is_drop_offer).map(product => {
              const cartItem = items.find(i => i.id === product.id)
              const qty = cartItem?.qty ?? 0
              const emoji = CAT_EMOJI[product.category] ?? '🛒'

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden flex flex-col transition active:scale-[0.99]"
                >
                  <div className="relative aspect-square w-full bg-gray-50 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-5xl select-none">{emoji}</span>
                    )}
                    <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      {product.unit}
                    </span>
                  </div>

                  <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-xs leading-snug line-clamp-1">{product.name}</h3>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                        {product.description ?? 'Fresh & delivered fast'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        {product.original_price && (
                          <p className="text-[10px] text-red-400 line-through leading-none">₹{product.original_price}</p>
                        )}
                        <p className="text-sm font-extrabold text-gray-950">₹{product.price}</p>
                      </div>

                      {qty === 0 ? (
                        <button
                          onClick={() => handleAdd(product)}
                          className="bg-emerald-50 text-emerald-800 border border-emerald-300/80 hover:bg-emerald-100 font-bold text-xs px-3.5 py-1.5 rounded-xl transition active:scale-90"
                        >
                          ADD
                        </button>
                      ) : (
                        <div className="flex items-center bg-emerald-800 text-white rounded-xl">
                          <button onClick={() => updateQty(product.id, qty - 1)} className="p-1.5 hover:bg-emerald-700 rounded-l-xl active:scale-75 transition">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold min-w-[20px] text-center">{qty}</span>
                          <button onClick={() => updateQty(product.id, qty + 1)} className="p-1.5 hover:bg-emerald-700 rounded-r-xl active:scale-75 transition">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Sticky Bottom Cart Pill */}
      {count > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40">
          <Link
            href="/checkout"
            className="flex items-center justify-between bg-emerald-900 text-white p-3.5 px-4 rounded-2xl shadow-xl shadow-emerald-950/25 active:scale-[0.98] transition border border-emerald-700"
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-300">
                {count} {count === 1 ? 'Item' : 'Items'} in Cart
              </span>
              <span className="text-base font-black">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-sm bg-emerald-800/80 px-3.5 py-1.5 rounded-xl">
              <span>Continue to Delivery</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      )}

      {/* Upsell Drawer */}
      {showUpsell && (
        <UpsellDrawer upsells={upsellProducts} onClose={() => setShowUpsell(false)} />
      )}
    </div>
  )
}
