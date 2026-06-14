// app/api/wallet/topup/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount } = await req.json();
    if (!amount || isNaN(amount)) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    const email = session.user.email;
    const username = session.user.name || email;

    const walletRes = await query('SELECT id FROM wallets WHERE email = $1', [email]);
    if (walletRes.rowCount === 0) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

    const walletId = walletRes.rows[0].id;

    await query(
      'INSERT INTO topup_requests (wallet_id, username, amount) VALUES ($1, $2, $3)',
      [walletId, username, amount]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Topup error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
