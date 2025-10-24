const startPaymentWorkers = require('@/lib/paymentWorker').default;

// Start payment workers only on server-side
if (typeof window === 'undefined') {
  startPaymentWorkers();
}