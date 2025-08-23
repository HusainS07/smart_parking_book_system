import dbConnect from "@/lib/dbConnect";
import User from "@/models/user";
import Wallet from "@/models/wallet";
import { ratelimit } from "@/lib/ratelimiter";

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    const allowed = await ratelimit({
      key: `ip:${ip}`,   // limit per IP
      limit: 5,          // 5 registrations max
      window_in_seconds: 600 // in 10 minutes
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ message: "Too many registration attempts. Try again later." }),
        { status: 429 }
      );
    }

    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ message: "Email and password are required" }), { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ message: "User already exists" }), { status: 400 });
    }

    const name = email.split("@")[0];
    const newUser = new User({ name, email, password });
    await newUser.save();

    const newWallet = new Wallet({ username: name, email, balance: 0 });
    await newWallet.save();

    return new Response(JSON.stringify({ message: "User registered successfully and wallet created" }), { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return new Response(JSON.stringify({ message: "An error occurred during registration" }), { status: 500 });
  }
}
