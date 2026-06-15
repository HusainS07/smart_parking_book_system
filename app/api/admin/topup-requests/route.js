// app/api/admin/topup-requests/route.js
import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    const result = await query(
      `SELECT tr.*, w.email AS wallet_email, w.balance AS wallet_balance
       FROM topup_requests tr
       JOIN wallets w ON tr.wallet_id = w.id
       WHERE tr.status = 'pending'
       ORDER BY tr.created_at DESC`
    );

    // Shape to match frontend expectations
    const requests = result.rows.map(r => ({
      _id: r.id,
      walletid: {
        _id: r.wallet_id,
        email: r.wallet_email,
        balance: parseFloat(r.wallet_balance),
      },
      username: r.username,
      amount: parseFloat(r.amount),
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json(requests);
  } catch (err) {
    console.error("GET topup-requests error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { id, action } = await req.json();
    if (!id || !action) {
      return NextResponse.json({ error: "Missing ID or action" }, { status: 400 });
    }

    // Fetch the request
    const reqRes = await query('SELECT * FROM topup_requests WHERE id = $1', [id]);
    if (reqRes.rowCount === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    const topupReq = reqRes.rows[0];

    if (action === "approve") {
      // Add amount to wallet balance
      await query(
        'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
        [topupReq.amount, topupReq.wallet_id]
      );
      // Update request status
      await query(
        "UPDATE topup_requests SET status = 'approved', updated_at = NOW() WHERE id = $1",
        [id]
      );
    } else if (action === "reject") {
      await query(
        "UPDATE topup_requests SET status = 'rejected', updated_at = NOW() WHERE id = $1",
        [id]
      );
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
