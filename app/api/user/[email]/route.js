import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request, { params }) {
  console.log('=== GET /api/user/[email] Debug Info ===');
  console.log('Raw params:', params);
  console.log('params.email:', params.email);
  
  try {
    await dbConnect();
    
    // Decode the email parameter
    const email = decodeURIComponent(params.email);
    console.log('Decoded email:', email);
    
    // Debug: Check if user exists with different queries
    const userExact = await User.findOne({ email: email });
    console.log('Exact match found:', !!userExact);
    
    // Try case-insensitive search
    const userCaseInsensitive = await User.findOne({ 
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });
    console.log('Case-insensitive match found:', !!userCaseInsensitive);
    
    // Debug: List all users (remove in production)
    const allUsers = await User.find({}, { email: 1, _id: 0 }).limit(10);
    console.log('Sample users in DB:', allUsers.map(u => u.email));
    
    const user = userExact || userCaseInsensitive;
    
    if (!user) {
      console.log('No user found for email:', email);
      return NextResponse.json({ 
        message: 'User not found',
        searchedEmail: email,
        debug: {
          rawParam: params.email,
          decodedEmail: email
        }
      }, { status: 404 });
    }
    
    console.log('User found successfully');
    return NextResponse.json(user, { status: 200 });
    
  } catch (err) {
    console.error('GET /api/user/[email] error:', err);
    return NextResponse.json(
      { 
        message: 'Server error', 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  console.log('=== PUT /api/user/[email] Debug Info ===');
  console.log('Raw params:', params);
  console.log('params.email:', params.email);
  
  try {
    await dbConnect();
    
    // Decode the email parameter
    const email = decodeURIComponent(params.email);
    console.log('Decoded email:', email);
    
    // Check if user exists first
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      console.log('User not found for update:', email);
      return NextResponse.json({ 
        message: 'User not found for update',
        searchedEmail: email 
      }, { status: 404 });
    }
    
    console.log('User found, processing update...');
    
    const formData = await request.formData();
    const updateData = {};
    
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, typeof value === 'object' ? '[File]' : value);
      
      if (key === 'image' && typeof value === 'object' && value.name) {
        try {
          console.log('Processing image upload...');
          const buffer = Buffer.from(await value.arrayBuffer());
          const uploadDir = path.join(process.cwd(), 'public/uploads');
          
          // Ensure uploads directory exists
          await mkdir(uploadDir, { recursive: true });

          const filename = `${Date.now()}-${value.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const filepath = path.join(uploadDir, filename);

          await writeFile(filepath, buffer);
          updateData.image = `/uploads/${filename}`;
          console.log('Image uploaded successfully:', updateData.image);
        } catch (imageErr) {
          console.error('Image upload error:', imageErr);
          return NextResponse.json(
            { message: 'Image upload failed', error: imageErr.message },
            { status: 500 }
          );
        }
      } else if (key !== 'image') {
        updateData[key] = value;
      }
    }
    
    console.log('Update data:', updateData);
    
    const updatedUser = await User.findOneAndUpdate(
      { email }, 
      updateData, 
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedUser) {
      console.log('User update failed - user not found');
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    console.log('User updated successfully');
    return NextResponse.json(updatedUser, { status: 200 });
    
  } catch (err) {
    console.error('PUT /api/user/[email] error:', err);
    
    // Handle specific MongoDB/Mongoose errors
    if (err.name === 'ValidationError') {
      return NextResponse.json(
        { 
          message: 'Validation error', 
          error: err.message,
          validationErrors: err.errors
        },
        { status: 400 }
      );
    }
    
    if (err.name === 'CastError') {
      return NextResponse.json(
        { message: 'Invalid data format', error: err.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        message: 'Update failed', 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}