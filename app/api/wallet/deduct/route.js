import dbConnect from '@/lib/dbConnect';
import Wallet from '@/models/wallet';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, amount } = await req.json();
    if (!email || !amount) {
      return NextResponse.json({ error: 'Missing email or amount' }, { status: 400 });
    }

    await dbConnect();
    const wallet = await Wallet.findOne({ email });
    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    wallet.balance -= amount;
    await wallet.save();

    return NextResponse.json({ newBalance: wallet.balance }, { status: 200 });
  } catch (err) {
    console.error('❌ Error deducting wallet:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}