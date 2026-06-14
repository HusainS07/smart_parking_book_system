// app/api/wallet/amount/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    const result = await query('SELECT balance FROM wallets WHERE email = $1', [email]);
    const balance = result.rowCount > 0 ? parseFloat(result.rows[0].balance) : 0;

    return NextResponse.json({ balance }, { status: 200 });
  } catch (err) {
    console.error('Error fetching wallet:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}