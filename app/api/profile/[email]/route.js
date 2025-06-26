import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export async function GET(request, { params }) {
  console.log('=== GET /api/profile/[email] Debug Info ===');
  console.log('Raw params:', params);
  console.log('params.email:', params.email);
  
  try {
    // Decode the email parameter
    const email = decodeURIComponent(params.email);
    console.log('Decoded email:', email);
    
    await client.connect();
    const database = client.db('parker');
    const collection = database.collection('users');
    
    // Debug logging
    const totalUsers = await collection.countDocuments();
    console.log('Total users in DB:', totalUsers);
    
    // Try exact match first
    const user = await collection.findOne({ email });
    console.log('Exact match found:', !!user);
    
    if (!user) {
      // Try case-insensitive search as backup
      const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const userCaseInsensitive = await collection.findOne({
        email: { $regex: emailRegex }
      });
      console.log('Case-insensitive match found:', !!userCaseInsensitive);
      
      if (userCaseInsensitive) {
        console.log('Found user with case-insensitive search');
        return new Response(JSON.stringify(userCaseInsensitive), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Debug: Show sample emails in database
      const sampleUsers = await collection.find({}, { projection: { email: 1, _id: 0 } }).limit(5).toArray();
      console.log('Sample emails in DB:', sampleUsers.map(u => u.email));
      
      return new Response(JSON.stringify({ 
        message: 'User not found',
        searchedEmail: email,
        debug: {
          rawParam: params.email,
          decodedEmail: email,
          totalUsers: totalUsers
        }
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('User found successfully');
    return new Response(JSON.stringify(user), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('GET /api/profile/[email] error:', error);
    return new Response(JSON.stringify({ 
      message: 'Error fetching user data', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await client.close();
  }
}

export async function PUT(request, { params }) {
  console.log('=== PUT /api/profile/[email] Debug Info ===');
  console.log('Raw params:', params);
  console.log('params.email:', params.email);
  
  try {
    // Decode the email parameter
    const email = decodeURIComponent(params.email);
    console.log('Decoded email:', email);
    
    await client.connect();
    const database = client.db('parker');
    const collection = database.collection('users');
    
    // Check if user exists first
    const existingUser = await collection.findOne({ email });
    if (!existingUser) {
      console.log('User not found for update:', email);
      
      // Try case-insensitive search
      const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const userCaseInsensitive = await collection.findOne({
        email: { $regex: emailRegex }
      });
      
      if (!userCaseInsensitive) {
        return new Response(JSON.stringify({ 
          message: 'User not found for update',
          searchedEmail: email 
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    console.log('User found, processing update...');
    
    // Parse request body - check if it's FormData or JSON
    let updateData = {};
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing FormData...');
      const formData = await request.formData();
      
      for (const [key, value] of formData.entries()) {
        console.log(`FormData ${key}:`, typeof value === 'object' ? '[File]' : value);
        
        if (key === 'image' && typeof value === 'object' && value.name) {
          // Handle file upload - for MongoDB, you might want to store the file elsewhere
          // and save the URL/path in the database
          console.log('Image upload detected:', value.name);
          // For now, skip file handling in raw MongoDB - implement file storage as needed
          updateData[key] = `[File: ${value.name}]`; // Placeholder
        } else if (typeof value === 'string') {
          updateData[key] = value;
        }
      }
    } else if (contentType.includes('application/json')) {
      console.log('Processing JSON...');
      updateData = await request.json();
    } else {
      console.log('Processing as text...');
      const body = await request.text();
      try {
        updateData = JSON.parse(body);
      } catch (e) {
        updateData = { data: body };
      }
    }
    
    console.log('Update data:', updateData);
    
    // Add timestamp
    updateData.updatedAt = new Date();
    
    // Update the user
    const result = await collection.findOneAndUpdate(
      { email },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result || !result.value) {
      console.log('User update failed - no document returned');
      return new Response(JSON.stringify({ 
        message: 'User update failed',
        searchedEmail: email 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('User updated successfully');
    return new Response(JSON.stringify(result.value), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('PUT /api/profile/[email] error:', error);
    
    // Handle specific MongoDB errors
    let errorMessage = 'Update failed';
    let statusCode = 500;
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      if (error.code === 11000) {
        errorMessage = 'Duplicate key error';
        statusCode = 409;
      }
    }
    
    return new Response(JSON.stringify({ 
      message: errorMessage, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), { 
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await client.close();
  }
}