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
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    const user = userExact || userCaseInsensitive;

    if (!user) {
      return NextResponse.json(
        { message: 'User not found', searchedEmail: email },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    console.error('GET error:', err);
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  

  try {
    await dbConnect();
    const email = decodeURIComponent(params.email);

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate base64 image if provided
    if (body.image) {
      const base64Regex = /^data:image\/(jpeg|png|gif);base64,[A-Za-z0-9+/=]+$/;
      if (!base64Regex.test(body.image)) {
        return NextResponse.json({ message: 'Invalid image format. Must be a valid base64 image (JPEG, PNG, GIF).' }, { status: 400 });
      }
      // Optional: Check size (base64 string length)
      if (body.image.length > 7 * 1024 * 1024) { // Approx 5MB after base64 encoding
        return NextResponse.json({ message: 'Image size exceeds 5MB limit.' }, { status: 400 });
      }
    }

    const updateData = {};
    if (body.image) updateData.image = body.image;
    if (body.name) updateData.name = body.name;
    if (body.phone) updateData.phone = body.phone;
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.gender) updateData.gender = body.gender;
    if (body.dob) updateData.dob = body.dob;
    if (body.bloodGroup) updateData.bloodGroup = body.bloodGroup;
    if (body.fatherName) updateData.fatherName = body.fatherName;
    if (body.age) updateData.age = body.age;
    if (body.address) updateData.address = body.address;
    updateData.updatedAt = Date.now();

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