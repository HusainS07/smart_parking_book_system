import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  console.log('=== GET /api/user/[email] Debug Info ===');
  console.log('Raw params:', params);
  console.log('params.email:', params.email);
  
  try {
    await dbConnect();
    const email = decodeURIComponent(params.email);

    const userExact = await User.findOne({ email });
    const userCaseInsensitive = await User.findOne({ 
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });

    const user = userExact || userCaseInsensitive;

    if (!user) {
      return NextResponse.json({ 
        message: 'User not found', 
        searchedEmail: email 
      }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
    
  } catch (err) {
    console.error('GET error:', err);
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  console.log('=== PUT /api/user/[email] Debug Info ===');

  try {
    await dbConnect();
    const email = decodeURIComponent(params.email);

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const body = await request.json(); // Accept JSON { image: "<cloudinary-url>", ... }

    const updateData = {};
    if (body.image) updateData.image = body.image;
    if (body.name) updateData.name = body.name;
    if (body.phone) updateData.phone = body.phone;
    // Add more fields as needed...

    const updatedUser = await User.findOneAndUpdate({ email }, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (err) {
    console.error('PUT error:', err);
    return NextResponse.json({ message: 'Update failed', error: err.message }, { status: 500 });
  }
}
