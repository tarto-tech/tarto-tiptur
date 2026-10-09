import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const DROP_LIMIT = 49

export async function POST(req: NextRequest) {
  try {
    const { items, customerDetails, coords } = await req.json()
    const supabase = createServerClient()

    // Recalculate amount server-side from DB prices
    const productIds = items.map((i: any) => i.id)
    const { data: dbProducts, error: priceError } = await (supabase.from('products') as any)
      .select('id, price, is_drop_offer')
      .in('id', productIds)
    if (priceError || !dbProducts) throw new Error('Failed to verify product prices')

    const priceMap = Object.fromEntries((dbProducts as any[]).map((p: any) => [p.id, p]))
    const amount = items.reduce((sum: number, i: any) => {
      const p = priceMap[i.id]
      return sum + (p ? Number(p.price) * i.qty : 0)
    }, 0)

    const dropItems = items.filter((i: any) => priceMap[i.id]?.is_drop_offer)
    const regularItems = items.filter((i: any) => !priceMap[i.id]?.is_drop_offer)

    // ── Drop item: atomic check+insert via Postgres function ──────────────
    if (dropItems.length > 0) {
      const totalDropQty = dropItems.reduce((sum: number, i: any) => sum + i.qty, 0)
      if (totalDropQty > 1) {
        return NextResponse.json({ error: 'Only 1 Launch Drop pizza allowed per order.' }, { status: 400 })
      }

      const dropItem = dropItems[0]
      const { data, error } = await supabase.rpc('place_drop_order' as any, {
        p_customer_name: customerDetails.name,
        p_phone:         customerDetails.phone,
        p_address:       customerDetails.address,
        p_lat:           coords.lat,
        p_lng:           coords.lng,
        p_amount:        amount,
        p_product_id:    dropItem.id,
        p_unit_price:    priceMap[dropItem.id]?.price ?? dropItem.price,
        p_drop_limit:    DROP_LIMIT,
      })

      if (error) throw error
      const result = data as { error?: string; orderId?: string }
      if (result.error === 'sold_out') {
        return NextResponse.json({ error: 'Launch drop sold out! Please select standard menu items.' }, { status: 400 })
      }

      // Insert any regular items alongside the drop order
      if (regularItems.length > 0) {
        const extras = regularItems.map((item: any) => ({
          order_id:    result.orderId,
          product_id:  item.id,
          quantity:    item.qty,
          unit_price:  item.price,
          is_drop_item: false,
        }))
        await (supabase.from('order_items') as any).insert(extras)
      }

      return NextResponse.json({ orderId: result.orderId })
    }

    // ── Regular COD order (no drop item) ─────────────────────────────────
    const { data: order, error } = await (supabase.from('orders') as any)
      .insert({
        customer_name:  customerDetails.name,
        phone_number:   customerDetails.phone,
        address_notes:  customerDetails.address,
        delivery_lat:   coords.lat,
        delivery_lng:   coords.lng,
        total_amount:   amount,
        payment_status: 'cod',
        order_status:   'placed',
      })
      .select('id')
      .single()

    if (error) throw error

    const orderItems = regularItems.map((item: any) => ({
      order_id:    order.id,
      product_id:  item.id,
      quantity:    item.qty,
      unit_price:  item.price,
      is_drop_item: false,
    }))
    await (supabase.from('order_items') as any).insert(orderItems)

    return NextResponse.json({ orderId: order.id })
  } catch (err: any) {
    console.error('cod-order error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
