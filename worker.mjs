
// 4. worker.mjs - Debug Script

import dotenv from 'dotenv';
import { Redis } from '@upstash/redis';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const PAYMENT_QUEUE = 'payment:queue';

async function debugWorker() {
  console.log('Debug Worker System (Minimal Queue)\n');

  while (true) {
    try {
      const queueLength = await redis.llen(PAYMENT_QUEUE);
      console.log(` Queue length: ${queueLength}`);

      if (queueLength > 0) {
        const items = await redis.lrange(PAYMENT_QUEUE, 0, 0);
        
        if (items && items.length > 0) {
          const data = items[0];
          
          console.log('\n Next item in queue:');
          console.log(JSON.stringify(data, null, 2));
          
          console.log('\n Field check:');
          console.log(`  slotid: ${data.slotid} (${typeof data.slotid})`);
          console.log(`  date: ${data.date} (${typeof data.date})`);
          console.log(`  hour: ${data.hour} (${typeof data.hour})`);
          
          // Check what's missing from minimal queue
          const missing = [];
          if (!data.slotid) missing.push('slotid');
          if (!data.date) missing.push('date');
          if (data.hour === undefined || data.hour === null) missing.push('hour');
          
          if (missing.length > 0) {
            console.log(`\n Missing fields: ${missing.join(', ')}`);
            console.log(' Removing invalid item from queue...');
            await redis.lpop(PAYMENT_QUEUE);
            console.log(' Removed');
          } else {
            console.log('\n All required fields present!');
            console.log(' Item is valid (minimal queue: slotid + date + hour)');
            console.log(' Worker will fetch other data from database.');
            console.log(' You can now run the normal worker.');
            break;
          }
        }
      } else {
        console.log(' Queue is empty');
        console.log(' Make a new booking to test the flow\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      console.log('\n Checking again in 3 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(' Error:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

console.log(' Starting Debug Worker (Minimal Queue Mode)...');
console.log(' Queue should only contain: slotid, date, hour\n');
debugWorker();