// app/api/user/[email]/route.js

import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export async function GET(req, context) {
  const email = decodeURIComponent(context.params.email);

  try {
    await client.connect();
    const database = client.db('parker');
    const collection = database.collection('users');
    const user = await collection.findOne({ email });

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error fetching user data', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await client.close();
  }
}
