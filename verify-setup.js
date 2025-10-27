// ========================================
// VERIFICATION: Debug script to check queue format
// File: verify-setup.js
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

async function verify() {
  console.log('🔍 Verifying queue format...\n');

  const queueLength = await redis.llen(PAYMENT_QUEUE);
  console.log(`📊 Queue length: ${queueLength}`);

  if (queueLength > 0) {
    const items = await redis.lrange(PAYMENT_QUEUE, 0, 4); // Check first 5
    
    console.log('\n📦 Queue items:');
    items.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log(JSON.stringify(item, null, 2));
      
      const keys = Object.keys(item);
      const expectedKeys = ['slotid', 'date', 'hour', 'enqueuedAt'];
      const extraKeys = keys.filter(k => !expectedKeys.includes(k));
      const missingKeys = expectedKeys.filter(k => !keys.includes(k) && k !== 'enqueuedAt');
      
      if (extraKeys.length > 0) {
        console.log(`⚠️  Extra keys: ${extraKeys.join(', ')}`);
      }
      if (missingKeys.length > 0) {
        console.log(`❌ Missing keys: ${missingKeys.join(', ')}`);
      }
      if (extraKeys.length === 0 && missingKeys.length === 0) {
        console.log('✅ Format correct!');
      }
    });
  }

  const activeCount = await redis.scard(ACTIVE_ORDERS);
  console.log(`\n🔒 Active orders: ${activeCount}`);
  
  if (activeCount > 0) {
    const activeOrders = await redis.smembers(ACTIVE_ORDERS);
    console.log('\nFirst 5 active orders:');
    activeOrders.slice(0, 5).forEach(order => {
      console.log(`  - ${order}`);
      // Check format: should be slotid:date:hour
      const parts = order.split(':');
      if (parts.length === 3 && /^\d{4}-\d{2}-\d{2}$/.test(parts[1]) && !isNaN(parts[2])) {
        console.log('    ✅ Correct format (slotid:date:hour)');
      } else if (order.startsWith('order_')) {
        console.log('    ❌ OLD FORMAT (order_id) - needs cleanup!');
      }
    });
  }

  process.exit(0);
}

verify();