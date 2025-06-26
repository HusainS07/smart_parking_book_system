import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export async function GET(request, { params }) {
  console.log('=== GET /api/profile/[email] ===');
  const rawEmail = params.email;
  const email = decodeURIComponent(rawEmail);

  try {
    await client.connect();
    const db = client.db('parker');
    const users = db.collection('users');

    // Try exact match
    let user = await users.findOne({ email });

    // If not found, try case-insensitive match
    if (!user) {
      const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      user = await users.findOne({ email: { $regex: emailRegex } });

      if (!user) {
        return new Response(JSON.stringify({
          message: 'User not found',
          searchedEmail: email
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('GET error:', err);
    return new Response(JSON.stringify({ message: 'Internal server error', error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await client.close();
  }
}

export async function PUT(request, { params }) {
  console.log('=== PUT /api/profile/[email] ===');
  const rawEmail = params.email;
  const email = decodeURIComponent(rawEmail);

  try {
    await client.connect();
    const db = client.db('parker');
    const users = db.collection('users');

    // Step 1: Find the user (case insensitive)
    let user = await users.findOne({ email });
    if (!user) {
      const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      user = await users.findOne({ email: { $regex: emailRegex } });
      if (!user) {
        return new Response(JSON.stringify({ message: 'User not found for update' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Step 2: Parse incoming update data
    let updateData = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      updateData = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          updateData[key] = value;
        } else if (key === 'image' && value.name) {
          // TODO: handle actual image upload to Cloudinary/S3
          updateData[key] = `[File: ${value.name}]`;
        }
      }
    } else {
      const bodyText = await request.text();
      try {
        updateData = JSON.parse(bodyText);
      } catch {
        updateData = { rawBody: bodyText };
      }
    }

    updateData.updatedAt = new Date();

    // Step 3: Update using _id to avoid email case mismatch
    const result = await users.findOneAndUpdate(
      { _id: user._id },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result?.value) {
      return new Response(JSON.stringify({ message: 'User update failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result.value), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('PUT error:', err);
    return new Response(JSON.stringify({
      message: 'Error updating profile',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await client.close();
  }
}
