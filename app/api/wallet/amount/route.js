import dbConnect from '@/lib/dbConnect';
import Wallet from '@/models/wallet';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    await dbConnect();
    const wallet = await Wallet.findOne({ email });
    return NextResponse.json({ balance: wallet ? wallet.balance : 0 }, { status: 200 });
  } catch (err) {
    console.error('❌ Error fetching wallet:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}