// app/api/user/[email]/route.js

import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export async function GET(req, context) {
  const email = decodeURIComponent(context.params.email);
  
  // Add debug logging
  console.log('Searching for email:', email);
  console.log('Raw param:', context.params.email);

  try {
    await client.connect();
    const database = client.db('parker');
    const collection = database.collection('users');
    
    // Add debug - check total users
    const totalUsers = await collection.countDocuments();
    console.log('Total users in DB:', totalUsers);
    
    const user = await collection.findOne({ email });
    console.log('User found:', !!user);

    if (!user) {
      // Try case-insensitive search as backup
      const userCaseInsensitive = await collection.findOne({ 
        email: { $regex: new RegExp(`^${email}$`, 'i') } 
      });
      
      if (userCaseInsensitive) {
        console.log('Found user with case-insensitive search');
        return new Response(JSON.stringify(userCaseInsensitive), { status: 200 });
      }
      
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ message: 'Error fetching user data', error: error.message }), { status: 500 });
  } finally {
    await client.close();
  }
}