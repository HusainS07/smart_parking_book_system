import dbConnect from "@/lib/dbConnect";
import User from "@/models/user";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Email and password are required" }),
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(
        JSON.stringify({ message: "User already exists" }),
        { status: 400 }
      );
    }

    const name = email.split("@")[0];

    const newUser = new User({
      name,
      email,
      password
    });

    await newUser.save();

    return new Response(
      JSON.stringify({ message: "User registered successfully" }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration Error:", error);
    return new Response(
      JSON.stringify({ message: "An error occurred during registration" }),
      { status: 500 }
    );
  }
}
