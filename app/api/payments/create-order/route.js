
//  app/api/payments/create-order/route.js

import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import getPaymentQueue from '@/lib/paymentQueue';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error('❌ Unauthorized: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slotid, amount, date, hour } = await req.json();
    console.log('📝 Creating order for:', { slotid, amount, date, hour, email: session.user.email });

    // Validate inputs
    if (!slotid || !amount || !date || hour === undefined) {
      console.error('❌ Missing required fields:', { slotid, amount, date, hour });
      return NextResponse.json({ 
        error: 'Missing slotid, amount, date, or hour' 
      }, { status: 400 });
    }

    // Validate date format
    const dateString = String(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      console.error('❌ Invalid date format:', dateString);
      return NextResponse.json({ 
        error: 'Invalid date format (use YYYY-MM-DD)' 
      }, { status: 400 });
    }

    // Validate hour
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      console.error('❌ Invalid hour:', hour);
      return NextResponse.json({ 
        error: 'Invalid hour (must be 0–23)' 
      }, { status: 400 });
    }

    // Check if this booking is already being processed
    const paymentQueue = getPaymentQueue();
    const isProcessing = await paymentQueue.isBookingActive(slotid, dateString, hour);
    if (isProcessing) {
      console.log('⚠️ Booking already being processed:', { slotid, dateString, hour });
      return NextResponse.json({ 
        error: 'This booking is currently being processed' 
      }, { status: 409 });
    }

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `${slotid}_${hour}_${Date.now().toString().slice(-6)}`,
      payment_capture: 1,
    });

    console.log('✅ Razorpay order created:', { 
      orderId: order.id, 
      amount: order.amount, 
      currency: order.currency 
    });

    // ⚠️ CRITICAL: Queue ONLY slotid, date, hour
    const queued = await paymentQueue.enqueuePayment(slotid, dateString, hour);
    
    if (!queued) {
      console.error('❌ Failed to queue payment');
      return NextResponse.json({ 
        error: 'Failed to queue payment - already in progress' 
      }, { status: 409 });
    }

    console.log('✅ Queued minimal data:', { slotid, date: dateString, hour });
    console.log('💡 Worker will fetch email, payment_id, amount from database');

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    }, { status: 200 });
  } catch (err) {
    console.error('❌ Order creation error:', err);
    return NextResponse.json({ 
      error: 'Failed to create order', 
      details: err.message 
    }, { status: 500 });
  }
}
