// app/api/bookings/[email]/route.js

import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export async function GET(req, context) {
  const { email } = context.params;

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
