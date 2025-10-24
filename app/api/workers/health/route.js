import { NextResponse } from 'next/server';
import getRedisClient from '@/lib/redis';

// Add response headers for Vercel
import { NextResponse } from 'next/server';
import getRedisClient from '@/lib/redis-edge';

export const dynamic = 'force-dynamic';

export async function GET() {
export const dynamic = 'force-dynamic';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), 5000);
    });

    const checkHealth = async () => {
      const redis = getRedisClient();
      if (!redis) {
        throw new Error('Redis client not initialized');
      }
      
      await redis.ping();
      
      const [queueLength, activeOrders] = await Promise.all([
        redis.llen('payment:queue').catch(() => 0),
        redis.scard('payment:active_orders').catch(() => 0)
      ]);
      
      return { queueLength, activeOrders };
    };

    // Race between Redis operations and timeout
    const { queueLength, activeOrders } = await Promise.race([
      checkRedis(),
      timeoutPromise
    ]);

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