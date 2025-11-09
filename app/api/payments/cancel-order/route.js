// app/api/payments/cancel-order/route.js
// Cancel order endpoint - matches your create-order auth pattern

import { NextResponse } from 'next/server';
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

    const { slotid, date, hour } = await req.json();

    // Validate required fields
    if (!slotid || !date || (hour === undefined || hour === null)) {
      console.error('❌ Missing required fields:', { slotid, date, hour });
      return NextResponse.json(
        { error: 'Missing required fields: slotid, date, hour' },
        { status: 400 }
      );
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

    console.log('🗑️ API: Cancelling order:', { 
      slotid, 
      date: dateString, 
      hour, 
      email: session.user.email 
    });

    const queue = getPaymentQueue();
    
    // Remove from active orders set (releases the lock)
    await queue.completePayment(slotid, dateString, hour);
    
    console.log('✅ API: Order cancelled and lock released');

    return NextResponse.json({ 
      success: true,
      message: 'Order cancelled successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('❌ API: Cancel order error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel order',
        details: error.message 
      },
      { status: 500 }
    );
  }
}