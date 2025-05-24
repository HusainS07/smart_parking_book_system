import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as per your folder structure
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

  // Parse query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const usernameFromQuery = url.searchParams.get('username') || session.user.name;  // Use username if no query param

  console.log(`Looking for wallet for username: ${usernameFromQuery}`);

  // Fetch wallet info from the database using the username
  try {
    const wallet = await Wallet.findOne({ username: usernameFromQuery });

    // If no wallet found, return a 404 error
    if (!wallet) {
      console.log(`No wallet found for username: ${usernameFromQuery}`);
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Return the wallet info (username and balance)
    return NextResponse.json({
      username: usernameFromQuery,  // Return the username
      balance: wallet.balance || 0,  // Return the balance (default to 0 if not found)
    });
  } catch (err) {
    console.error("Error fetching wallet:", err);
    return NextResponse.json({ error: "Error fetching wallet" }, { status: 500 });
  }
}
