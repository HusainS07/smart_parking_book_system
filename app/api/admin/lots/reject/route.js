// app/api/admin/lots/reject/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Not an admin' }, { status: 401 });
    }

    const { lotId } = await req.json();

    await query('DELETE FROM parking_lots WHERE id = $1', [lotId]);
    console.log('Rejected lot:', lotId);

    return NextResponse.json({ message: 'Lot rejected and deleted' }, { status: 200 });
  } catch (err) {
    console.error('Error rejecting lot:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}