import { NextResponse } from 'next/server';
import getRedisClient from '@/lib/redis';

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
      
      // For Upstash Redis, we'll just check if we can perform a basic operation
      await redis.set('health:check', 'ok');
      await redis.del('health:check');
      
      const [queueLength, activeOrders] = await Promise.all([
        redis.llen('payment:queue'),
        redis.scard('payment:active_orders')
      ]);
      
      return { queueLength, activeOrders };
    };

    // Race between Redis operations and timeout
    const { queueLength, activeOrders } = await Promise.race([
      checkHealth(),
      timeoutPromise
    ]);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      queue: {
        length: queueLength,
        activeOrders: activeOrders
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}