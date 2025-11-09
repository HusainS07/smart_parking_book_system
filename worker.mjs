// 4. worker.mjs - Debug Script (Safe Version)

import dotenv from 'dotenv';
import { Redis } from '@upstash/redis';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const PAYMENT_QUEUE = 'payment:queue';
let shouldStop = false;
let isProcessing = false;

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('\n\n⏹️  Shutdown signal received...');
  shouldStop = true;
  
  // Wait for current operation to finish
  if (isProcessing) {
    console.log('⏳ Waiting for current operation to complete...');
    await new Promise(resolve => {
      const check = setInterval(() => {
        if (!isProcessing) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }
  
  console.log('✅ Worker stopped cleanly\n');
  process.exit(0);
});

async function debugWorker() {
  console.log('🔍 Debug Worker System (Minimal Queue)\n');
  console.log('📋 Expected fields: slotid, date, hour');
  console.log('ℹ️  Press Ctrl+C to stop gracefully\n');

  let consecutiveErrors = 0;
  const MAX_ERRORS = 5;

  while (!shouldStop) {
    isProcessing = true;
    
    try {
      const queueLength = await redis.llen(PAYMENT_QUEUE);
      console.log(`📊 Queue length: ${queueLength}`);

      if (queueLength > 0) {
        // SAFE: Only PEEK at the queue, don't remove yet
        const items = await redis.lrange(PAYMENT_QUEUE, 0, 0);
        
        if (items && items.length > 0) {
          let data;
          
          // Handle both string and object responses
          try {
            data = typeof items[0] === 'string' ? JSON.parse(items[0]) : items[0];
          } catch (parseError) {
            console.log('\n❌ Invalid JSON in queue item');
            console.log('🗑️  Removing corrupted item...');
            await redis.lpop(PAYMENT_QUEUE);
            console.log('✅ Removed\n');
            continue;
          }
          
          console.log('\n📦 Next item in queue:');
          console.log(JSON.stringify(data, null, 2));
          
          console.log('\n🔍 Field check:');
          console.log(`   slotid: ${data.slotid} (${typeof data.slotid})`);
          console.log(`   date: ${data.date} (${typeof data.date})`);
          console.log(`   hour: ${data.hour} (${typeof data.hour})`);
          
          // Check what's missing from minimal queue
          const missing = [];
          if (!data.slotid) missing.push('slotid');
          if (!data.date) missing.push('date');
          // Handle hour being 0 (which is valid)
          if (data.hour === undefined || data.hour === null) missing.push('hour');
          
          if (missing.length > 0) {
            console.log(`\n❌ Missing fields: ${missing.join(', ')}`);
            console.log('🗑️  Removing invalid item from queue...');
            await redis.lpop(PAYMENT_QUEUE);
            console.log('✅ Removed');
            
            // Continue checking if there are more items
            if (queueLength > 1) {
              console.log(`\n⏭️  Checking next item (${queueLength - 1} remaining)...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          } else {
            console.log('\n✅ All required fields present!');
            console.log('📝 Item is valid (minimal queue: slotid + date + hour)');
            console.log('🔄 Worker will fetch other data from database.');
            console.log('\n💡 This item is ready for the normal worker to process.');
            console.log('⚠️  Do NOT run this debug script alongside the production worker!\n');
            
            // Successfully found a valid item, exit
            shouldStop = true;
            break;
          }
        }
      } else {
        console.log('📭 Queue is empty');
        console.log('💡 Make a new booking to test the flow\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Reset error counter on success
      consecutiveErrors = 0;
      
      if (!shouldStop && queueLength === 0) {
        console.log('⏳ Checking again in 3 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (error) {
      consecutiveErrors++;
      
      console.error('\n❌ Error occurred:', error.message);
      
      // Handle specific error types
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.error('🔌 Redis connection failed');
      } else if (error.message?.includes('authentication')) {
        console.error('🔑 Redis authentication failed - check your credentials');
        console.error('⚠️  Stopping worker due to auth error');
        shouldStop = true;
        break;
      }
      
      if (consecutiveErrors >= MAX_ERRORS) {
        console.error(`\n⚠️  Too many consecutive errors (${MAX_ERRORS})`);
        console.error('🛑 Stopping worker for safety');
        shouldStop = true;
        break;
      }
      
      console.log(`🔄 Retrying in 5 seconds... (${consecutiveErrors}/${MAX_ERRORS} errors)\n`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    } finally {
      isProcessing = false;
    }
  }
  
  if (!shouldStop) {
    console.log('\n✅ Debug complete! Queue validation finished.');
  }
}

console.log('🚀 Starting Debug Worker (Minimal Queue Mode)...');
console.log('⚠️  WARNING: Do NOT run this with the production worker!\n');
debugWorker();