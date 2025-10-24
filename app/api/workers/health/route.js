import { NextResponse } from 'next/server';
import getRedisClient from '@/lib/redis';

export async function GET() {
  try {
    const redis = getRedisClient();
    
    // Check Redis connection
    await redis.ping();
    
    // Get queue statistics
    const queueLength = await redis.llen('payment:queue');
    const activeOrders = await redis.scard('payment:active_orders');
    
    return NextResponse.json({
      status: 'healthy',
      redis: 'connected',
      queue: {
        pending: queueLength,
        processing: activeOrders
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}