import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// ✅ FIXED: Correct parameter destructuring for App Router
export async function GET(request, { params }) {
  await dbConnect();
  
  try {
    // Decode the email parameter
    const email = decodeURIComponent(params.email);
    
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    console.error('GET /api/user/[email] error:', err);
    return NextResponse.json(
      { message: 'Server error', error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  await dbConnect();
  
  try {
    // Decode the email parameter
    const email = decodeURIComponent(params.email);
    
    const formData = await request.formData();
    const updateData = {};

    for (const [key, value] of formData.entries()) {
      if (key === 'image' && typeof value === 'object' && value.name) {
        try {
          const buffer = Buffer.from(await value.arrayBuffer());
          const uploadDir = path.join(process.cwd(), 'public/uploads');
          await mkdir(uploadDir, { recursive: true });

          const filename = `${Date.now()}-${value.name}`;
          const filepath = path.join(uploadDir, filename);

          await writeFile(filepath, buffer);
          updateData.image = `/uploads/${filename}`;
        } catch (imageErr) {
          console.error('Image upload error:', imageErr);
          return NextResponse.json(
            { message: 'Image upload failed', error: imageErr.message },
            { status: 500 }
          );
        }
      } else {
        updateData[key] = value;
      }
    }

    const user = await User.findOneAndUpdate({ email }, updateData, {
      new: true,
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    console.error('PUT /api/user/[email] error:', err);
    return NextResponse.json(
      { message: 'Update failed', error: err.message },
      { status: 500 }
    );
  }
}