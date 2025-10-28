

// lib/paymentWorker.js with cleanup

import getPaymentQueue from '@/lib/paymentQueue';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/payment';
import ParkingSlot from '@/models/parkingslots';

const WORKER_COUNT = 1;
const JOB_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const CLEANUP_INTERVAL = 60 * 1000; // Run cleanup every 1 minute

// Process a single payment by fetching data from database
async function processPayment(queueData, attempt = 1) {
  const { slotid, date, hour, enqueuedAt } = queueData;
  
  // Check if order has expired
  if (enqueuedAt) {
    const age = (Date.now() - enqueuedAt) / 1000; // seconds
    if (age > 300) { // 5 minutes
      console.log(` Order expired (${Math.floor(age)}s old):`, { slotid, date, hour });
      return false;
    }
  }
  
  console.log(`\n Processing payment (attempt ${attempt}/${MAX_RETRIES}):`, {
    slotid,
    date,
    hour
  });

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Payment processing timeout')), JOB_TIMEOUT)
  );
  
  try {
    await Promise.race([
      (async () => {
        await dbConnect();

        // Fetch the booking from database using slotid + date + hour
        const slot = await ParkingSlot.findOne({ slotid });
        
        if (!slot) {
          throw new Error(`Slot ${slotid} not found in database`);
        }

        // Find the specific booking for this date and hour
        const booking = slot.bookedHours.find(bh => {
          const bookingDate = bh.date.toISOString().split('T')[0];
          return bookingDate === date && bh.hour === hour;
        });

        if (!booking) {
          throw new Error(`Booking not found for ${slotid} on ${date} at ${hour}:00`);
        }

        console.log(' Found booking:', {
          email: booking.email,
          payment_id: booking.payment_id,
          date: booking.date,
          hour: booking.hour
        });

        // Check if payment already exists
        let payment = await Payment.findOne({ paymentid: booking.payment_id });
        
        if (payment) {
          if (payment.completed) {
            console.log(' Payment already completed:', booking.payment_id);
            return true;
          }
          console.log(' Updating existing payment:', booking.payment_id);
        } else {
          // Create new payment record
          console.log(' Creating new payment:', booking.payment_id);
          payment = new Payment({
            paymentid: booking.payment_id,
            useremail: booking.email,
            amount: slot.amount || 100,
            completed: false
          });
          await payment.save();
        }

        // Simulate payment processing
        console.log(' Processing payment through gateway...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mark payment as complete
        payment.completed = true;
        payment.completedAt = new Date();
        await payment.save();

        console.log(` Payment processed successfully:`, {
          paymentId: payment.paymentid,
          email: payment.useremail,
          amount: payment.amount,
          slotid,
          date,
          hour: `${hour}:00-${hour + 1}:00`,
          timestamp: new Date().toISOString()
        });

        return true;
      })(),
      timeoutPromise
    ]);

    return true;
  } catch (error) {
    console.error(` Error processing payment (attempt ${attempt}):`, {
      error: error.message,
      slotid,
      date,
      hour
    });

    // Retry logic
    if (attempt < MAX_RETRIES) {
      console.log(` Retrying in ${attempt * 2} seconds...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      return processPayment(queueData, attempt + 1);
    }

    return false;
  }
}

// Cleanup worker that runs periodically
async function cleanupWorker() {
  const queue = getPaymentQueue();
  
  while (true) {
    try {
      console.log('\n Running cleanup check...');
      const cleaned = await queue.cleanupExpiredOrders();
      
      if (cleaned > 0) {
        console.log(` Cleanup completed: ${cleaned} expired orders removed`);
      }
      
      // Show stats
      const stats = await queue.getStats();
      console.log(' Queue Stats:', {
        queueLength: stats.queueLength,
        activeOrders: stats.activeCount,
        oldestOrderAge: `${stats.oldestAge}s`,
        averageOrderAge: `${stats.averageAge}s`
      });
      
    } catch (error) {
      console.error(' Cleanup worker error:', error);
    }
    
    // Wait before next cleanup
    await new Promise(resolve => setTimeout(resolve, CLEANUP_INTERVAL));
  }
}

// Worker function that continuously processes payments
async function paymentWorker(workerId) {
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 5;
  const queue = getPaymentQueue();

  console.log(` Worker ${workerId} started`);

  while (true) {
    try {
      // Get next payment from queue (only slotid, date, hour)
      const queueData = await queue.dequeuePayment();
      
      if (queueData) {
        console.log(`\n Worker ${workerId}: Processing booking:`, queueData);
        
        const success = await processPayment(queueData);
        
        if (success) {
          // Remove from active set
          await queue.completePayment(queueData.slotid, queueData.date, queueData.hour);
          consecutiveErrors = 0; // Reset error count
        } else {
          console.error(` Failed to process after ${MAX_RETRIES} attempts`);
          // Still complete to avoid blocking queue
          await queue.completePayment(queueData.slotid, queueData.date, queueData.hour);
        }
      } else {
        // No payments to process, wait a bit
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      consecutiveErrors++;
      console.error(` Worker ${workerId} error (${consecutiveErrors}/${maxConsecutiveErrors}):`, error);
      
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.error(` Worker ${workerId} stopping due to too many consecutive errors`);
        break;
      }

      // Exponential backoff
      const delay = Math.min(Math.pow(2, consecutiveErrors) * 1000, 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Worker stopped, restart after delay
  console.log(` Restarting Worker ${workerId} in 30 seconds...`);
  setTimeout(() => paymentWorker(workerId), 30000);
}

// Start payment processing workers
export function startPaymentWorkers() {
  console.log(`\n Starting ${WORKER_COUNT} payment worker(s)...`);
  console.log(` Queue mode: Minimal (slotid + date + hour only)`);
  console.log(` Cleanup interval: ${CLEANUP_INTERVAL / 1000}s`);
  console.log(` Order timeout: 5 minutes\n`);
  
  // Start cleanup worker
  cleanupWorker().catch(err => {
    console.error(' Cleanup worker crashed:', err);
  });
  
  // Start payment workers
  for (let i = 1; i <= WORKER_COUNT; i++) {
    paymentWorker(i).catch(err => {
      console.error(` Payment worker ${i} crashed:`, err);
    });
  }
}

export default startPaymentWorkers;