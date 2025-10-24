import getPaymentQueue from '@/lib/paymentQueue';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/payment';

// Number of worker functions to run
const WORKER_COUNT = 2; // Reduced number of workers
const MAX_CONCURRENT_JOBS = 5; // Maximum concurrent jobs per worker
const JOB_TIMEOUT = 30000; // 30 seconds timeout per job

// Process a single payment with timeout
async function processPayment(paymentData) {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Payment processing timeout')), JOB_TIMEOUT)
  );
  const { orderId, amount, currency, slotid, email } = paymentData;
  
  try {
    // Race between timeout and actual processing
    await Promise.race([
      (async () => {
        await dbConnect();

        // Create payment record
        const payment = new Payment({
          paymentid: orderId,
          useremail: email,
          amount: amount,
          completed: false
        });
        
        await payment.save();
      })(),
      timeoutPromise
    ]);

    // Process payment through Razorpay
    // Note: Actual payment processing would happen through webhooks
    // This is just to demonstrate the queue processing

    // Mark payment as complete
    payment.completed = true;
    await payment.save();

    // Remove from active orders
    const queue = getPaymentQueue();
    await queue.completePayment(orderId);

    console.log(`✅ Payment processed successfully for order ${orderId}`, {
      amount: amount,
      email: email,
      slotid: slotid,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error(`❌ Error processing payment for order ${orderId}:`, error);
    return false;
  }
}

// Worker function that continuously processes payments
async function paymentWorker(workerId) {
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 5;
  const queue = getPaymentQueue();

  while (true) {
    try {
      // Get next payment from queue
      const paymentData = await queue.dequeuePayment();
      
      if (paymentData) {
        console.log(`Worker ${workerId}: Processing payment for order ${paymentData.orderId}`);
        await processPayment(paymentData);
        // Reset error count on successful processing
        consecutiveErrors = 0;
      } else {
        // No payments to process, wait a bit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      consecutiveErrors++;
      console.error(`Worker ${workerId} error (${consecutiveErrors}/${maxConsecutiveErrors}):`, error);
      
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.error(`Worker ${workerId} stopping due to too many consecutive errors`);
        break;
      }

      // Exponential backoff with max delay of 30 seconds
      const delay = Math.min(Math.pow(2, consecutiveErrors) * 1000, 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Worker stopped, try to restart after a delay
  console.log(`Restarting Worker ${workerId} in 30 seconds...`);
  setTimeout(() => paymentWorker(workerId), 30000);
}

// Start payment processing workers
export function startPaymentWorkers() {
  console.log(`Starting ${WORKER_COUNT} payment workers...`);
  
  for (let i = 1; i <= WORKER_COUNT; i++) {
    paymentWorker(i).catch(err => {
      console.error(`Payment worker ${i} crashed:`, err);
    });
  }
}

export default startPaymentWorkers;