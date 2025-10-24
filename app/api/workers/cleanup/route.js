import { NextResponse } from 'next/server';
import getPaymentQueue from '@/lib/paymentQueue';

export async function POST() {
  try {
    const queue = getPaymentQueue();
    const redis = queue.redis;
    
    // Get all active orders
    const activeOrders = await redis.smembers('payment:active_orders');
    
    // Clean up orders older than 30 minutes
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    let cleanedCount = 0;
    
    for (const orderId of activeOrders) {
      const orderTime = await redis.get(`order:${orderId}:timestamp`);
      if (!orderTime || parseInt(orderTime) < thirtyMinutesAgo) {
        await redis.srem('payment:active_orders', orderId);
        await redis.del(`order:${orderId}:timestamp`);
        cleanedCount++;
      }
    }
    
    return NextResponse.json({
      status: 'success',
      cleaned: cleanedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}