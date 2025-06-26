// app/api/user/[email]/route.js

import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export async function GET(req, context) {
  // DECODE the email parameter - this is the key fix!
  const email = decodeURIComponent(context.params.email);
  
  // Add temporary logging to debug
  console.log('Raw email param:', context.params.email);
  console.log('Decoded email:', email);

  try {
    await client.connect();
    const database = client.db('parker');
    const collection = database.collection('users');
    const user = await collection.findOne({ email });

    if (!user) {
      console.log('User not found for email:', email);
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
    }

    console.log('User found:', user.email);
    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ message: 'Error fetching user data', error: error.message }), { status: 500 });
  } finally {
    await client.close();
  }
}