import  dbConnect  from "@/lib/dbConnect"; // Ensure this path is correct
import Help from "@/models/help"; // Your help model

export async function POST(req) {
  try {
    const { name, email, query } = await req.json(); // Get data from the request body

    // Validate that all fields are filled
    if (!name || !email || !query) {
      return new Response(
        JSON.stringify({ error: "Please fill all the fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Connect to the database
    await dbConnect();

    // Create a new help query entry
    const newHelp = new Help({ name, email, query });

    // Save the entry to the database
    await newHelp.save();

    return new Response(
      JSON.stringify({ message: "Query submitted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Could not send the message" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
