import getRedisClient from '@/lib/redis';

// Queue names
const PAYMENT_QUEUE = 'payment:queue';
const ACTIVE_ORDERS = 'payment:active_orders';

export class PaymentQueue {
  constructor() {
    this.redis = getRedisClient();
  }

  // Add a payment request to the queue
  async enqueuePayment(paymentData) {
    const { orderId } = paymentData;
    
    // Check if order is already being processed
    const isProcessing = await this.redis.sismember(ACTIVE_ORDERS, orderId);
    if (isProcessing) {
      // Optionally requeue with delay
      setTimeout(() => this.enqueuePayment(paymentData), 5000);
      return;
    }

    // Add to active orders set (atomic operation)
    const added = await this.redis.sadd(ACTIVE_ORDERS, orderId);
    if (added) {
      // Add to processing queue
      await this.redis.rpush(PAYMENT_QUEUE, JSON.stringify(paymentData));
      console.log(`✅ Payment request queued for order ${orderId}`);
    } else {
      console.log(`⚠️ Order ${orderId} is already being processed`);
    }
  }

  // Get next payment request from queue
  async dequeuePayment() {
    const data = await this.redis.lpop(PAYMENT_QUEUE);
    if (!data) return null;
    return JSON.parse(data);
  }

  // Remove order from active set after processing
  async completePayment(orderId) {
    await this.redis.srem(ACTIVE_ORDERS, orderId);
  }

  // Check if an order is currently being processed
  async isOrderActive(orderId) {
    return await this.redis.sismember(ACTIVE_ORDERS, orderId);
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