import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import Wallet from "@/models/wallet";
import { NextResponse } from "next/server";

export async function GET(req) {
  // Connect to the database
  await dbConnect();

  // Get the user session
  const session = await getServerSession(authOptions);

  // Check if the user is logged in
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  console.log(`Looking for wallet with email: ${email}`);

  try {
    const wallet = await Wallet.findOne({ email });

    if (!wallet) {
      console.log(`No wallet found for email: ${email}`);
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json({
      username: wallet.username,       // still return username for display
      balance: wallet.balance || 0,    // default balance to 0
    });
  } catch (err) {
    console.error("Error fetching wallet:", err);
    return NextResponse.json({ error: "Error fetching wallet" }, { status: 500 });
  }
}
