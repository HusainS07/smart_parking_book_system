import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// ✅ FIXED: use `context.params`
export async function GET(req, context) {
  await dbConnect();
  const { email } = context.params;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: 'Server error', error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  await dbConnect();
  const { email } = context.params;

  const formData = await req.formData();
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
        return NextResponse.json(
          { message: 'Image upload failed', error: imageErr.message },
          { status: 500 }
        );
      }
    } else {
      updateData[key] = value;
    }
  }

  try {
    const user = await User.findOneAndUpdate({ email }, updateData, {
      new: true,
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: 'Update failed', error: err.message },
      { status: 500 }
    );
  }
}
