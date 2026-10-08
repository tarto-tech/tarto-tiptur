import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const DROP_LIMIT = 49

export async function POST(req: NextRequest) {
  try {
    const { amount, items, customerDetails, coords } = await req.json()

    const supabase = createServerClient()

    // Drop offer guard
    const dropItems = items.filter((i: any) => i.is_drop_offer)
    if (dropItems.length > 0) {
      const totalDropQty = dropItems.reduce((sum: number, i: any) => sum + i.qty, 0)
      if (totalDropQty > 1) {
        return NextResponse.json({ error: 'Only 1 Launch Drop pizza allowed per order.' }, { status: 400 })
      }
      const { data: dropCount } = await supabase.rpc('get_drop_order_count' as any)
      if (((dropCount as unknown as number) ?? 0) >= DROP_LIMIT) {
        return NextResponse.json({ error: 'Launch drop sold out! Please select standard menu items.' }, { status: 400 })
      }
    }

    // Insert order directly as COD
    const { data: order, error } = await (supabase.from('orders') as any)
      .insert({
        customer_name: customerDetails.name,
        phone_number: customerDetails.phone,
        address_notes: customerDetails.address,
        delivery_lat: coords.lat,
        delivery_lng: coords.lng,
        total_amount: amount,
        payment_status: 'cod',
        order_status: 'placed',
      })
      .select('id')
      .single()

    if (error) throw error

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.qty,
      unit_price: item.price,
      is_drop_item: item.is_drop_offer ?? false,
    }))
    await (supabase.from('order_items') as any).insert(orderItems)

    return NextResponse.json({ orderId: order.id })
  } catch (err: any) {
    console.error('cod-order error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
