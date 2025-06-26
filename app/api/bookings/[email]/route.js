import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

// ✅ FIXED: Use { params } instead of context
export async function GET(request, { params }) {
  const email = decodeURIComponent(params.email);

  try {
    await client.connect();
    const database = client.db('parker');
    const collection = database.collection('ParkingSlot');
    const bookings = await collection.find({ bookedby: email }).toArray();

    return new Response(JSON.stringify(bookings), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error fetching bookings', error: error.message }), { status: 500 });
  } finally {
    await client.close();
  }
}