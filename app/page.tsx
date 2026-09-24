import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase'
import type { Product } from '@/lib/types'
import ProductCard from '@/components/ProductCard'

export const metadata: Metadata = {
  title: 'Tarto — Fresh Delivery in Tiptur',
  description: 'Order fresh eggs, milk, bread and more. Fast local delivery in Tiptur, Karnataka. Cash on delivery.',
}

async function getProducts(): Promise<Product[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .order('created_at')
  return data ?? []
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const products = await getProducts()

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2D6A4F] to-[#40916C] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <p className="text-[#95D5B2] text-sm font-medium uppercase tracking-widest mb-3">Tiptur, Karnataka</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Fresh groceries,<br />delivered to your door
          </h1>
          <p className="text-[#B7E4C7] text-lg max-w-md mx-auto">
            Eggs, milk, bread and more — ordered in seconds, delivered fast. Cash on delivery.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm">
            <span className="w-2 h-2 bg-[#F4A261] rounded-full animate-pulse" />
            Delivering in Tiptur
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Shop</h2>
        {products.length === 0 ? (
          <p className="text-gray-400">No products available right now.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
