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
  await dbConnect();
  const { id, action } = await req.json(); // id = TopUpReq ID

  const request = await TopUpReq.findById(id).populate("walletid");
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  if (action === "approve") {
    request.status = "approved";
    request.walletid.amount += request.amount;
    await request.walletid.save();
  } else if (action === "reject") {
    request.status = "rejected";
  }

  await request.save();
  return NextResponse.json({ success: true });
}
