// Import necessary dependencies
import dbConnect from "@/lib/dbConnect";
import ParkingSlot from "@/models/parkingslots"; // Ensure this matches your model file name exactly

export async function GET(request) {
  // Get the location from the query parameters
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") || "mumbai"; // Default to "mumbai" if no location is specified

  // Connect to MongoDB
  await dbConnect();

  try {
    // Fetch slots based on the dynamic location
    const slots = await ParkingSlot.find({
      location: location,
      alloted: false, // Only fetch slots that are not allotted
    });

    console.log(`Available ${location} Slots:`, slots);  // Optional: For debugging

    return new Response(JSON.stringify(slots), { status: 200 });
  } catch (err) {
    console.error(`Error fetching ${location} slots:`, err);
    return new Response(
      JSON.stringify({ error: `Failed to fetch ${location} slots` }),
      { status: 500 }
    );
  }
}
