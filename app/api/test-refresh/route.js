// app/api/test-refresh/route.js
import refreshSlotDates from '@/utils/refreshSlotDates';

export async function GET() {
  await refreshSlotDates();
  return new Response('✅ Slots refreshed successfully', { status: 200 });
}
