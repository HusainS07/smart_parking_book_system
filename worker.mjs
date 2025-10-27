// ========================================
// 4. worker.mjs - UPDATED Debug Script
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

async function debugWorker() {
  console.log('🔍 Debug Worker System (Minimal Queue: slotid + date + hour)\n');

  while (true) {
    try {
      const queueLength = await redis.llen(PAYMENT_QUEUE);
      const activeCount = await redis.scard(ACTIVE_ORDERS);
      
      console.log(`📊 Queue Status:`);
      console.log(`   Queue length: ${queueLength}`);
      console.log(`   Active orders: ${activeCount}`);

      if (activeCount > 0) {
        const activeOrders = await redis.smembers(ACTIVE_ORDERS);
        console.log(`\n🔒 Active orders:`, activeOrders);
      }

      if (queueLength > 0) {
        const items = await redis.lrange(PAYMENT_QUEUE, 0, 0);
        
        if (items && items.length > 0) {
          const data = items[0];
          
          console.log('\n📦 Next item in queue:');
          console.log(JSON.stringify(data, null, 2));
          
          console.log('\n🔍 Field check:');
          console.log(`  slotid: ${data.slotid} (${typeof data.slotid})`);
          console.log(`  date: ${data.date} (${typeof data.date})`);
          console.log(`  hour: ${data.hour} (${typeof data.hour})`);
          
          // Check required fields
          const missing = [];
          if (!data.slotid) missing.push('slotid');
          if (!data.date) missing.push('date');
          if (data.hour === undefined || data.hour === null) missing.push('hour');
          
          // Check for extra fields (should only have these 3)
          const allowedFields = ['slotid', 'date', 'hour'];
          const extraFields = Object.keys(data).filter(key => !allowedFields.includes(key));
          
          if (extraFields.length > 0) {
            console.log(`\n⚠️  Extra fields found: ${extraFields.join(', ')}`);
            console.log('   (Queue should only contain slotid, date, hour)');
          }
          
          if (missing.length > 0) {
            console.log(`\n❌ Missing required fields: ${missing.join(', ')}`);
            console.log('🗑️  Removing invalid item from queue...');
            await redis.lpop(PAYMENT_QUEUE);
            console.log('✅ Removed');
          } else {
            console.log('\n✅ All required fields present!');
            console.log(`📌 Booking key: ${data.slotid}:${data.date}:${data.hour}`);
            console.log('💡 Worker will fetch payment_id, email, amount from database');
            console.log('💡 You can now run the normal worker to process this.');
            break;
          }
        }
      } else {
        console.log('\n📭 Queue is empty');
        console.log('💡 Make a new booking to test the flow\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      console.log('\n⏳ Checking again in 3 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error('❌ Error:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

console.log('🔍 Starting Debug Worker...');
console.log('📋 Validating queue contains ONLY: slotid, date, hour\n');
debugWorker();