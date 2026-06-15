// app/api/user/[email]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

/* --------------------------------------------------------------------------
   GET /api/user/[email]
   Fetches user details based on the provided email parameter.
-------------------------------------------------------------------------- */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(params.email);

    // Users can only access their own profile
    if (session.user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { message: 'User not found', searchedEmail: email },
        { status: 404 }
      );
    }

    // Shape response to match frontend expectations (camelCase)
    // NOTE: password is deliberately excluded — never expose hashes via API
    const shaped = {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      firstName: user.first_name,
      lastName: user.last_name,
      gender: user.gender,
      phone: user.phone,
      dob: user.dob,
      bloodGroup: user.blood_group,
      fatherName: user.father_name,
      age: user.age,
      address: user.address,
      updatedAt: user.updated_at,
    };

    return NextResponse.json(shaped, { status: 200 });
  } catch (err) {
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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(params.email);

    // Users can only update their own profile
    if (session.user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if the user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate base64 image if provided
    if (body.image) {
      const base64Regex = /^data:image\/(jpeg|png|gif);base64,[A-Za-z0-9+/=]+$/;
      if (!base64Regex.test(body.image)) {
        return NextResponse.json(
          { message: 'Invalid image format. Must be a valid base64 image (JPEG, PNG, GIF).' },
          { status: 400 }
        );
      }
      if (body.image.length > 7 * 1024 * 1024) {
        return NextResponse.json(
          { message: 'Image size exceeds 5MB limit.' },
          { status: 400 }
        );
      }
    }

    // Build dynamic SET clause
    const fields = [];
    const values = [];
    let idx = 1;

    const fieldMap = {
      image: 'image',
      name: 'name',
      phone: 'phone',
      firstName: 'first_name',
      lastName: 'last_name',
      gender: 'gender',
      dob: 'dob',
      bloodGroup: 'blood_group',
      fatherName: 'father_name',
      age: 'age',
      address: 'address',
    };

    for (const [bodyKey, dbCol] of Object.entries(fieldMap)) {
      if (body[bodyKey] !== undefined) {
        fields.push(`${dbCol} = $${idx}`);
        values.push(body[bodyKey]);
        idx++;
      }
    }

    // Always update updated_at
    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) {
      // Only updated_at, nothing else to update
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    values.push(email); // for WHERE clause

    const updateQuery = `UPDATE users SET ${fields.join(', ')} WHERE email = $${idx} RETURNING *`;
    const result = await query(updateQuery, values);
    const updatedUser = result.rows[0];

    // Shape response
    const shaped = {
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      image: updatedUser.image,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      gender: updatedUser.gender,
      phone: updatedUser.phone,
      dob: updatedUser.dob,
      bloodGroup: updatedUser.blood_group,
      fatherName: updatedUser.father_name,
      age: updatedUser.age,
      address: updatedUser.address,
      updatedAt: updatedUser.updated_at,
    };

    return NextResponse.json(shaped, { status: 200 });
  } catch (err) {
    console.error('PUT error:', err);
    return NextResponse.json(
      { message: 'Update failed', error: err.message },
      { status: 500 }
    );
  }
}
