// app/api/admin/topup-requests/route.js
import dbConnect from "@/lib/dbConnect";
import TopUpReq from "@/models/TopUpReq";
import Wallet from "@/models/wallet";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  const requests = await TopUpReq.find({ status: "pending" }).populate("walletid");
  return NextResponse.json(requests);
}




export async function PUT(req) {
  try {
    await dbConnect();

    const { id, action } = await req.json();
    if (!id || !action) {
      return NextResponse.json({ error: "Missing ID or action" }, { status: 400 });
    }

    const request = await TopUpReq.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const wallet = await Wallet.findById(request.walletid);
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (action === "approve") {
      request.status = "approved";
      wallet.balance += request.amount;
      await wallet.save(); // Save wallet first
    } else if (action === "reject") {
      request.status = "rejected";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await request.save(); // Save status change
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
