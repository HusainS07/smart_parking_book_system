// ========================================
// CLEANUP SCRIPT - Run this to clear old data
// File: clear-queue.mjs
// ========================================
import dotenv from 'dotenv';
import { Redis } from '@upstash/redis';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const PAYMENT_QUEUE = 'payment:queue';
const ACTIVE_ORDERS = 'payment:active_orders';
const ACTIVE_ORDERS_TTL = 'payment:active_orders:ttl';

async function cleanup() {
  console.log('🧹 Starting cleanup of old queue data...\n');

  try {
    // Clear the queue
    const queueLength = await redis.llen(PAYMENT_QUEUE);
    if (queueLength > 0) {
      await redis.del(PAYMENT_QUEUE);
      console.log(`✅ Cleared ${queueLength} items from queue`);
    } else {
      console.log('✅ Queue already empty');
    }

    // Clear active orders set
    const activeCount = await redis.scard(ACTIVE_ORDERS);
    if (activeCount > 0) {
      await redis.del(ACTIVE_ORDERS);
      console.log(`✅ Cleared ${activeCount} items from active orders set`);
    } else {
      console.log('✅ Active orders set already empty');
    }

    // Clear TTL hash
    const ttlExists = await redis.exists(ACTIVE_ORDERS_TTL);
    if (ttlExists) {
      await redis.del(ACTIVE_ORDERS_TTL);
      console.log('✅ Cleared TTL tracking hash');
    } else {
      console.log('✅ TTL hash already empty');
    }

    console.log('\n✨ Cleanup complete! You can now make new bookings.');
    console.log('💡 New queue will only contain: slotid, date, hour');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }

  process.exit(0);
}

cleanup();