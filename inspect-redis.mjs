// inspect-redis.mjs 
import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const PAYMENT_QUEUE = 'payment:queue';
const ACTIVE_BOOKINGS = 'booking:active';

async function inspectRedis() {
  console.log('🔍 Inspecting Redis data...\n');

  // Check queue length
  const queueLength = await redis.llen(PAYMENT_QUEUE);
  console.log(` Queue length: ${queueLength}`);

  // Get all items in queue (without removing them)
  if (queueLength > 0) {
    console.log('\n Items in queue:');
    const items = await redis.lrange(PAYMENT_QUEUE, 0, -1);
    items.forEach((item, index) => {
      console.log(`\n--- Item ${index + 1} ---`);
      if (typeof item === 'object') {
        console.log(JSON.stringify(item, null, 2));
      } else {
        console.log('Raw:', item);
        try {
          const parsed = JSON.parse(item);
          console.log('Parsed:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Could not parse as JSON');
        }
      }
    });
  }

  // Check active bookings
  const activeBookings = await redis.smembers(ACTIVE_BOOKINGS);
  console.log(`\n Active bookings: ${activeBookings?.length || 0}`);
  if (activeBookings?.length > 0) {
    activeBookings.forEach(key => console.log(`   - ${key}`));
  }

  console.log('\n Inspection complete');
  process.exit(0);
}

inspectRedis().catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});