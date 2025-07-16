
import { NextResponse } from 'next/server';
import Pusher from 'pusher';

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// In-memory store for webhook endpoints (replace with DB in production)
const webhooks = new Set();

// POST: Register a webhook endpoint
export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url || !url.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid HTTPS URL' }, { status: 400 });
    }
    webhooks.add(url);
    console.log(`Server: Registered webhook: ${url}`);
    return NextResponse.json({ message: 'Webhook registered' }, { status: 200 });
  } catch (err) {
    console.error('Server: Webhook registration error:', err);
    return NextResponse.json({ error: 'Failed to register webhook' }, { status: 500 });
  }
}

// Trigger webhook notifications
export async function triggerBookingWebhook(bookingData) {
  try {
    // Trigger Pusher event for real-time client updates
    await pusher.trigger('parking-bookings', 'booking_created', bookingData);
    console.log('Server: Pusher event triggered:', bookingData);

    // Notify registered webhook endpoints
    for (const url of webhooks) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'booking_created',
            payload: bookingData,
            timestamp: new Date().toISOString(),
          }),
        });
        if (!response.ok) {
          console.error(`Server: Failed to notify webhook ${url}: ${response.status}`);
        }
      } catch (err) {
        console.error(`Server: Error notifying webhook ${url}:`, err);
      }
    }
  } catch (err) {
    console.error('Server: Webhook trigger error:', err);
  }
}

// GET: List registered webhooks (for debugging)
export async function GET() {
  return NextResponse.json({ webhooks: Array.from(webhooks) }, { status: 200 });
}
