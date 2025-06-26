import { MongoClient } from 'mongodb';

let cachedClient = null;
async function connectToMongo() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const allowedUpdateFields = ['name', 'phone', 'image', 'bio']; // Add more as needed

export async function GET(request, { params }) {
  const rawEmail = params.email;
  const email = decodeURIComponent(rawEmail);

  if (process.env.NODE_ENV === 'development') {
    console.log('GET /api/profile/[email]');
    console.log('Email param:', rawEmail);
    console.log('Decoded:', email);
  }

  try {
    const client = await connectToMongo();
    const db = client.db('parker');
    const users = db.collection('users');

    let user = await users.findOne({ email });

    if (!user) {
      const emailRegex = new RegExp(`^${escapeRegex(email)}$`, 'i');
      user = await users.findOne({ email: { $regex: emailRegex } });
    }

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found', searchedEmail: email }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GET error:', error);
    return new Response(
      JSON.stringify({
        message: 'Error fetching user',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request, { params }) {
  const rawEmail = params.email;
  const email = decodeURIComponent(rawEmail);

  if (process.env.NODE_ENV === 'development') {
    console.log('PUT /api/profile/[email]');
    console.log('Email param:', rawEmail);
    console.log('Decoded:', email);
  }

  try {
    const client = await connectToMongo();
    const db = client.db('parker');
    const users = db.collection('users');

    // Check if user exists
    let user = await users.findOne({ email });
    if (!user) {
      const emailRegex = new RegExp(`^${escapeRegex(email)}$`, 'i');
      user = await users.findOne({ email: { $regex: emailRegex } });
      if (!user) {
        return new Response(
          JSON.stringify({ message: 'User not found for update', searchedEmail: email }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    let updateData = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (key === 'image' && typeof value === 'object' && value.name) {
          // TODO: Upload to S3/Cloudinary if needed
          updateData[key] = `[File: ${value.name}]`; // Placeholder
        } else if (typeof value === 'string') {
          updateData[key] = value;
        }
      }
    } else if (contentType.includes('application/json')) {
      updateData = await request.json();
    } else {
      try {
        updateData = JSON.parse(await request.text());
      } catch {
        return new Response(JSON.stringify({ message: 'Invalid request body format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Filter fields
    const safeUpdate = {};
    for (const key in updateData) {
      if (allowedUpdateFields.includes(key)) {
        safeUpdate[key] = updateData[key];
      }
    }

    safeUpdate.updatedAt = new Date();

    const result = await users.findOneAndUpdate(
      { email: user.email },
      { $set: safeUpdate },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return new Response(JSON.stringify({ message: 'User update failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result.value), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('PUT error:', error);
    return new Response(
      JSON.stringify({
        message: 'Update failed',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
