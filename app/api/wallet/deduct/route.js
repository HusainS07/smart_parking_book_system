// app/api/wallet/deduct/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from "@/lib/db";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json();
    const email = session.user.email;

    if (amount == null || isNaN(amount)) {
      return NextResponse.json({ error: "Invalid or missing amount" }, { status: 400 });
    }

    const walletRes = await query('SELECT id, balance FROM wallets WHERE email = $1', [email]);
    if (walletRes.rowCount === 0) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const currentBalance = parseFloat(walletRes.rows[0].balance);
    if (currentBalance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const newBalance = currentBalance - amount;
    await query('UPDATE wallets SET balance = $1 WHERE email = $2', [newBalance, email]);

    return NextResponse.json({ success: true, newBalance });
  } catch (error) {
    console.error("Error deducting balance:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
