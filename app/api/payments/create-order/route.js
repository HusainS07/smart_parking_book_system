import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import getPaymentQueue from '@/lib/paymentQueue';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error('Unauthorized: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slotid, amount } = await req.json();
    console.log('Creating order for:', { slotid, amount });

    if (!slotid || !amount) {
      console.error('Missing slotid or amount');
      return NextResponse.json({ error: 'Missing slotid or amount' }, { status: 400 });
    }

    // Check if this slot is already being processed
    const paymentQueue = getPaymentQueue();
    const isProcessing = await paymentQueue.isOrderActive(`slot_${slotid}`);
    if (isProcessing) {
      return NextResponse.json({ error: 'This slot is currently being processed' }, { status: 409 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${slotid}_${Date.now()}`,
      payment_capture: 1,
    });

    console.log('Order created:', { orderId: order.id, amount: order.amount, currency: order.currency });

    // Queue the payment for processing
    await paymentQueue.enqueuePayment({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      slotid,
      email: session.user.email
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    }, { status: 200 });
  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: 'Failed to create order', details: err.message }, { status: 500 });
  }
}