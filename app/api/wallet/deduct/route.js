import dbConnect from "@/lib/dbConnect";
import Wallet from "@/models/wallet";
import { NextResponse } from "next/server";

export async function POST(req) {
  await dbConnect(); // ⬅️ FIXED this line

  const { username, amount } = await req.json();

  if (!username || amount == null) {
    return NextResponse.json({ error: "Missing username or amount" }, { status: 400 });
  }

  try {
    // Find the wallet
    const wallet = await Wallet.findOne({ username });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Deduct balance
    if (wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    wallet.balance -= amount;
    await wallet.save();

    return NextResponse.json({ success: true, newBalance: wallet.balance });

  } catch (error) {
    console.error("Error deducting balance:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
