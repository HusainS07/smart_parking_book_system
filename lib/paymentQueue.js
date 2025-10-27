
// ========================================
// 2. UPDATED lib/paymentQueue.js with TTL
// ========================================
import getRedisClient from '@/lib/redis';

const PAYMENT_QUEUE = 'payment:queue';
const ACTIVE_ORDERS = 'payment:active_orders';
const ACTIVE_ORDERS_TTL = 'payment:active_orders:ttl'; // Store timestamps
const ORDER_TIMEOUT = 5 * 60; // 5 minutes in seconds

export class PaymentQueue {
  constructor() {
    this.redis = getRedisClient();
  }

  // Create unique identifier from booking details
  createBookingKey(slotid, date, hour) {
    return `${slotid}:${date}:${hour}`;
  }

  // Add a payment request to the queue (minimal data)
  async enqueuePayment(slotid, date, hour) {
    const bookingKey = this.createBookingKey(slotid, date, hour);
    
    // Check if already being processed
    const isProcessing = await this.redis.sismember(ACTIVE_ORDERS, bookingKey);
    if (isProcessing) {
      console.log(`⚠️ Booking ${bookingKey} is already being processed`);
      return false;
    }

    // Add to active orders set (atomic operation)
    const added = await this.redis.sadd(ACTIVE_ORDERS, bookingKey);
    if (added) {
      // Store timestamp for TTL tracking
      const timestamp = Date.now();
      await this.redis.hset(ACTIVE_ORDERS_TTL, bookingKey, timestamp);
      
      // Add minimal data to queue
      await this.redis.rpush(PAYMENT_QUEUE, JSON.stringify({
        slotid,
        date,
        hour,
        enqueuedAt: timestamp
      }));
      
      console.log(`✅ Payment request queued: ${bookingKey}`);
      return true;
    } else {
      console.log(`⚠️ Booking ${bookingKey} is already queued`);
      return false;
    }
  }

  // Get next payment request from queue
  async dequeuePayment() {
    const data = await this.redis.lpop(PAYMENT_QUEUE);
    if (!data) return null;
    return JSON.parse(data);
  }

  // Remove booking from active set after processing
  async completePayment(slotid, date, hour) {
    const bookingKey = this.createBookingKey(slotid, date, hour);
    await this.redis.srem(ACTIVE_ORDERS, bookingKey);
    await this.redis.hdel(ACTIVE_ORDERS_TTL, bookingKey);
    console.log(`✅ Completed: ${bookingKey}`);
  }

  // Check if a booking is currently being processed
  async isBookingActive(slotid, date, hour) {
    const bookingKey = this.createBookingKey(slotid, date, hour);
    return await this.redis.sismember(ACTIVE_ORDERS, bookingKey);
  }

  // Cleanup expired orders (older than ORDER_TIMEOUT)
  async cleanupExpiredOrders() {
    try {
      const now = Date.now();
      const allTimestamps = await this.redis.hgetall(ACTIVE_ORDERS_TTL);
      
      if (!allTimestamps) {
        console.log('🧹 No active orders to clean');
        return 0;
      }

      let cleanedCount = 0;
      const expiredKeys = [];

      // Find expired orders
      for (const [bookingKey, timestamp] of Object.entries(allTimestamps)) {
        const age = (now - parseInt(timestamp)) / 1000; // age in seconds
        if (age > ORDER_TIMEOUT) {
          expiredKeys.push(bookingKey);
          console.log(`🧹 Expired order found: ${bookingKey} (age: ${Math.floor(age)}s)`);
        }
      }

      // Remove expired orders
      if (expiredKeys.length > 0) {
        for (const key of expiredKeys) {
          await this.redis.srem(ACTIVE_ORDERS, key);
          await this.redis.hdel(ACTIVE_ORDERS_TTL, key);
          cleanedCount++;
        }
        console.log(`✅ Cleaned ${cleanedCount} expired orders`);
      } else {
        console.log('✨ No expired orders to clean');
      }

      return cleanedCount;
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      return 0;
    }
  }

  // Get queue statistics
  async getStats() {
    const queueLength = await this.redis.llen(PAYMENT_QUEUE);
    const activeCount = await this.redis.scard(ACTIVE_ORDERS);
    const now = Date.now();
    
    const allTimestamps = await this.redis.hgetall(ACTIVE_ORDERS_TTL) || {};
    const ages = Object.values(allTimestamps).map(ts => {
      return Math.floor((now - parseInt(ts)) / 1000);
    });

    return {
      queueLength,
      activeCount,
      oldestAge: ages.length > 0 ? Math.max(...ages) : 0,
      averageAge: ages.length > 0 ? Math.floor(ages.reduce((a, b) => a + b, 0) / ages.length) : 0
    };
  }
}

// Singleton instance
let queueInstance;

export function getPaymentQueue() {
  if (!queueInstance) {
    queueInstance = new PaymentQueue();
  }
  return queueInstance;
}

export default getPaymentQueue;