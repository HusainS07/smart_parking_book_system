import dbConnect from "@/lib/dbConnect";
import User from "@/models/user";
import Wallet from "@/models/wallet";
import { ratelimit } from "@/lib/ratelimiter";
import bcrypt from "bcryptjs"; // using bcryptjs for Node.js

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    const allowed = await ratelimit({
      key: `ip:${ip}`,
      limit: 5,
      window_in_seconds: 600
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

    // Hash the password
    const salt = await bcrypt.genSalt(10); // 10 rounds of salt
    const hashedPassword = await bcrypt.hash(password, salt);

    const name = email.split("@")[0];
    const newUser = new User({ name, email, password: hashedPassword }); // save hashed password
    await newUser.save();

    const newWallet = new Wallet({ username: name, email, balance: 0 });
    await newWallet.save();

    return new Response(JSON.stringify({ message: "User registered successfully and wallet created" }), { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return new Response(JSON.stringify({ message: "An error occurred during registration" }), { status: 500 });
  }
}
