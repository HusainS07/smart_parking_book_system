import { NextResponse } from 'next/server';
import refreshSlotDates from '@/utils/refreshSlotDates';

export async function GET() {
  try {
    await refreshSlotDates();
    return NextResponse.json({ message: 'Slots refreshed successfully' }, { status: 200 });
  } catch (err) {
    console.error('Error refreshing slots:', err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}