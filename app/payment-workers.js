// Initialize workers conditionally in development
import startPaymentWorkers from '@/lib/paymentWorker';

// Only start workers in development and on server-side
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  console.log('Starting payment workers in development mode...');
  startPaymentWorkers().catch(err => {
    console.error('Failed to start payment workers:', err);
  });
}

export {};