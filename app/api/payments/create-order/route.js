import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slotid, amount } = await req.json();
    if (!slotid || !amount) {
      return NextResponse.json({ error: 'Missing slotid or amount' }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${slotid}_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    }, { status: 200 });
  } catch (err) {
    console.error('❌ Error creating Razorpay order:', err);
    return NextResponse.json({ error: 'Failed to create order', details: err.message }, { status: 500 });
  }
}