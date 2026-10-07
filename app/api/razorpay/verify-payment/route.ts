import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json()

    // Verify HMAC SHA256 signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Update order to paid
    const supabase = createServerClient()
    const { error } = await (supabase.from('orders') as any)
      .update({
        payment_status: 'paid',
        order_status: 'placed',
        razorpay_payment_id: razorpayPaymentId,
      })
      .eq('id', orderId)

    if (error) throw error

    return NextResponse.json({ success: true, orderId })
  } catch (err: any) {
    console.error('verify-payment error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
