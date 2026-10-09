import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase'
import type { Product } from '@/lib/types'
import StoreFront from '@/components/StoreFront'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tarto — Fresh Delivery in Tiptur',
  description: 'Order fresh milk, eggs, bread, pizza and more. Fast local delivery in Tiptur, Karnataka. Cash on delivery.',
}

export const DROP_LIMIT = 49

export default async function HomePage() {
  const supabase = createServerClient()

  const [{ data: products }, { data: dropCountData }] = await Promise.all([
    (supabase.from('products') as any)
      .select('*')
      .eq('is_in_stock', true)
      .order('is_drop_offer', { ascending: false })
      .order('category')
      .order('name'),
    supabase.rpc('get_drop_order_count' as any),
  ])

  const dropRemaining = Math.max(0, DROP_LIMIT - ((dropCountData as unknown as number) ?? 0))

  return <StoreFront products={(products ?? []) as Product[]} dropRemaining={dropRemaining} />
}
