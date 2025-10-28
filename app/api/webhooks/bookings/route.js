// app/api/webhooks/bookings/route.js
import { NextResponse } from 'next/server';
import Pusher from 'pusher';

//  Initialize a Pusher client (for real-time events)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true, // ensures secure connection
});

//  Temporary in-memory store for webhook URLs

const webhooks = new Set();

/* -------------------------- POST: Register a webhook --------------------------
   This endpoint lets external services register their HTTPS URLs.
   When a new booking happens, these URLs will be notified via POST request.
--------------------------------------------------------------------------- */
export async function POST(request) {
  try {
    const { url } = await request.json();

    // Validate input: must be a secure HTTPS URL
    if (!url || !url.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid HTTPS URL' }, { status: 400 });
    }

    // Save the webhook URL
    webhooks.add(url);
    console.log(`Server: Registered webhook: ${url}`);

    return NextResponse.json({ message: 'Webhook registered' }, { status: 200 });
  } catch (err) {
    console.error('Server: Webhook registration error:', err);
    return NextResponse.json({ error: 'Failed to register webhook' }, { status: 500 });
  }
}

/* --------------------- Function: Trigger Webhook Notifications ---------------------
   This function is called whenever a new booking is created.
   It does two things:
     1️⃣ Sends a real-time event to clients via Pusher
     2️⃣ Notifies all registered webhook URLs with booking details
------------------------------------------------------------------------------------ */
export async function triggerBookingWebhook(bookingData) {
  try {
    // (1) Trigger a Pusher event for real-time frontend updates
    await pusher.trigger('parking-bookings', 'booking_created', bookingData);
    console.log('Server: Pusher event triggered:', bookingData);

    // (2) Notify all registered webhooks by sending them a POST request
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

        // Log if webhook notification fails
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

/* -------------------------- GET: List Registered Webhooks --------------------------
   Returns a list of all currently registered webhook URLs.
   Useful for debugging or viewing webhook registrations.
------------------------------------------------------------------------------------ */
export async function GET() {
  return NextResponse.json({ webhooks: Array.from(webhooks) }, { status: 200 });
}
