// app/api/wallet/deduct/route.js
import dbConnect from "@/lib/dbConnect";
import Wallet from "@/models/wallet";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount } = await req.json();
  const email = session.user.email;

  if (amount == null || isNaN(amount)) {
    return NextResponse.json({ error: "Invalid or missing amount" }, { status: 400 });
  }

  try {
    const wallet = await Wallet.findOne({ email }); //  Query by email

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

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
