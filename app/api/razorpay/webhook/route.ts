import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)

  if (event.event === 'payment.captured') {
    const razorpayOrderId: string = event.payload.payment.entity.order_id
    const razorpayPaymentId: string = event.payload.payment.entity.id

    const supabase = createServerClient()
    await (supabase.from('orders') as any)
      .update({ payment_status: 'paid', razorpay_payment_id: razorpayPaymentId })
      .eq('razorpay_order_id', razorpayOrderId)
      .eq('payment_status', 'pending') // idempotent — skip if already paid
  }

  return NextResponse.json({ received: true })
}
