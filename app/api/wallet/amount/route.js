import dbConnect from '@/lib/dbConnect';
import Wallet from '@/models/wallet';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = session.user.email;

    await dbConnect();
    const wallet = await Wallet.findOne({ email });
    return NextResponse.json({ balance: wallet ? wallet.balance : 0 }, { status: 200 });
  } catch (err) {
    console.error('❌ Error fetching wallet:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}