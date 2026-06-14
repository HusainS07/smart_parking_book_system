import { query } from "@/lib/db";
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

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ message: "Email and password are required" }), { status: 400 });
    }

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rowCount > 0) {
      return new Response(JSON.stringify({ message: "User already exists" }), { status: 400 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const name = email.split("@")[0];

    // Create user
    await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hashedPassword]
    );

    // Create wallet
    await query(
      'INSERT INTO wallets (email, balance) VALUES ($1, $2)',
      [email, 0]
    );

    return new Response(JSON.stringify({ message: "User registered successfully and wallet created" }), { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return new Response(JSON.stringify({ message: "An error occurred during registration" }), { status: 500 });
  }
}
