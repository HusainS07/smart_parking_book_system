// app/api/user/[email]/route.js

import dbConnect from '@/lib/dbConnect'; // Utility to connect to MongoDB
import User from '@/models/user';        // Mongoose model for the User collection
import { NextResponse } from 'next/server'; // Helper for sending HTTP responses in Next.js

/* --------------------------------------------------------------------------
   GET /api/user/[email]
   Fetches user details based on the provided email parameter.
-------------------------------------------------------------------------- */
export async function GET(request, { params }) {
  console.log('=== GET /api/user/[email] Debug Info ===');
  console.log('Raw params:', params);
  console.log('params.email:', params.email);

  try {
    // Connect to the MongoDB database
    await dbConnect();

    // Decode email (handles URL-encoded characters such as %40 for "@")
    const email = decodeURIComponent(params.email);

    // Try to find a user with an exact email match
    const userExact = await User.findOne({ email });

    // If not found, perform a case-insensitive match using regex
    const userCaseInsensitive = await User.findOne({
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    // Use whichever match succeeds
    const user = userExact || userCaseInsensitive;

    // If no user is found, return 404
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', searchedEmail: email },
        { status: 404 }
      );
    }

    // Return user data as JSON
    return NextResponse.json(user, { status: 200 });

  } catch (err) {
    // Handle unexpected server or database errors
    console.error('GET error:', err);
    return NextResponse.json(
      { message: 'Server error', error: err.message },
      { status: 500 }
    );
  }
}

/* --------------------------------------------------------------------------
   PUT /api/user/[email]
   Updates user details for the given email.
-------------------------------------------------------------------------- */
export async function PUT(request, { params }) {
  try {
    // Connect to the MongoDB database
    await dbConnect();

    // Decode the email parameter
    const email = decodeURIComponent(params.email);

    // Check if the user exists before attempting an update
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Parse the incoming JSON request body
    const body = await request.json();

    // Validate base64 image if provided
    if (body.image) {
      const base64Regex = /^data:image\/(jpeg|png|gif);base64,[A-Za-z0-9+/=]+$/;

      // Check that the image is in a valid format
      if (!base64Regex.test(body.image)) {
        return NextResponse.json(
          { message: 'Invalid image format. Must be a valid base64 image (JPEG, PNG, GIF).' },
          { status: 400 }
        );
      }

      // Optionally check image size (base64 string length, roughly 5 MB)
      if (body.image.length > 7 * 1024 * 1024) {
        return NextResponse.json(
          { message: 'Image size exceeds 5MB limit.' },
          { status: 400 }
        );
      }
    }

    // Prepare updated fields dynamically
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

    // Update the "updatedAt" timestamp
    updateData.updatedAt = Date.now();

    // Perform the actual update and return the new document
    const updatedUser = await User.findOneAndUpdate(
      { email },
      updateData,
      {
        new: true,          // Return the updated document
        runValidators: true // Apply Mongoose schema validations
      }
    );

    // Return the updated user data
    return NextResponse.json(updatedUser, { status: 200 });

  } catch (err) {
    // Handle any errors that occur during the update process
    console.error('PUT error:', err);
    return NextResponse.json(
      { message: 'Update failed', error: err.message },
      { status: 500 }
    );
  }
}
