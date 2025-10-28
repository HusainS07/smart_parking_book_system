
// app/api/wallet/topup/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Wallet from "@/models/wallet";
import TopUpReq from "@/models/TopUpReq";
import { NextResponse } from "next/server";

export async function POST(req) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || isNaN(amount)) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const email = session.user.email;
  const username = session.user.name || email;

  const wallet = await Wallet.findOne({ email });
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

  const topupRequest = new TopUpReq({ walletid: wallet._id, username, amount });
  await topupRequest.save();

  return NextResponse.json({ success: true });
}
