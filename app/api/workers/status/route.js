import { NextResponse } from 'next/server';
import getPaymentQueue from '@/lib/paymentQueue';
import startPaymentWorkers from '@/lib/paymentWorker';

export async function GET() {
  try {
    // Start workers if needed
    await startPaymentWorkers();
    
    // Get queue instance to check status
    const queue = getPaymentQueue();
    const redis = queue.redis;
    
    // Check Redis connection with ping
    await redis.ping();
    
    // Get current queue stats
    const activeOrders = await redis.scard('payment:active_orders');
    const queueLength = await redis.llen('payment:queue');
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: {
        activeOrders,
        queueLength
      }
    });
  } catch (error) {
    console.error('Worker health check failed:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}